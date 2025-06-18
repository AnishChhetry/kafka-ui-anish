package api

import (
	"backend/kafka"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

var kafkaService kafka.KafkaService

// Initialize sets up the Kafka service
func Initialize(service kafka.KafkaService) {
	kafkaService = service
}

func GetTopics(c *gin.Context) {
	topics, err := kafkaService.ListTopics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, topics)
}

func GetMessages(c *gin.Context) {
	topic := c.Param("name")
	limitStr := c.DefaultQuery("limit", "5")
	limit, _ := strconv.Atoi(limitStr)
	sortOrder := c.DefaultQuery("sort", "newest")

	messages, err := kafkaService.FetchMessages(topic, limit, sortOrder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, messages)
}

func ProduceMessage(c *gin.Context) {
	type reqBody struct {
		Topic     string `json:"topic"`
		Key       string `json:"key,omitempty"`
		Value     string `json:"value,omitempty"`
		Partition int32  `json:"partition"`
		Headers   []struct {
			Key   string `json:"key"`
			Value string `json:"value"`
		} `json:"headers,omitempty"`
	}
	var body reqBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// If partition is -1, let Kafka choose the partition
	var partition int32 = -1
	if body.Partition >= 0 {
		partition = body.Partition
	}

	// Convert headers to MessageHeader type
	headers := make([]kafka.MessageHeader, len(body.Headers))
	for i, h := range body.Headers {
		headers[i] = kafka.MessageHeader{
			Key:   h.Key,
			Value: h.Value,
		}
	}

	if err := kafkaService.Produce(body.Topic, body.Key, []byte(body.Value), partition, headers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "sent"})
}

func DeleteMessages(c *gin.Context) {
	topic := c.Param("name")
	if err := kafkaService.DeleteAndRecreateTopic(topic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func DeleteTopic(c *gin.Context) {
	topic := c.Param("name")
	if err := kafkaService.DeleteTopic(topic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func CreateTopic(c *gin.Context) {
	type reqBody struct {
		Name              string `json:"name"`
		Partitions        int    `json:"partitions"`
		ReplicationFactor int    `json:"replicationFactor"`
	}
	var body reqBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate input
	if body.Partitions < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Number of partitions must be at least 1"})
		return
	}

	if body.ReplicationFactor < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Replication factor must be at least 1"})
		return
	}

	if err := kafkaService.CreateTopic(body.Name, body.Partitions, body.ReplicationFactor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func GetPartitionInfo(c *gin.Context) {
	topic := c.Param("name")
	partitions, err := kafkaService.GetPartitionInfo(topic)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, partitions)
}

func GetBrokers(c *gin.Context) {
	brokers, err := kafkaService.GetBrokers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, brokers)
}

func GetConsumers(c *gin.Context) {
	consumers, err := kafkaService.GetConsumers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, consumers)
}

func CheckConnection(c *gin.Context) {
	bootstrapServer := c.Query("bootstrapServer")
	if bootstrapServer == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bootstrapServer parameter is required"})
		return
	}

	// Create a new Kafka client with the provided bootstrap server
	client := kafka.NewKafkaClient(bootstrapServer)
	if err := client.CheckConnection(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update the global kafkaService with the new client
	kafkaService = client

	c.JSON(http.StatusOK, gin.H{"status": "connected"})
}
