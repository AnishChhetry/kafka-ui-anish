package api

import (
	"backend/kafka"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

var kafkaService kafka.KafkaService

// Initialize sets up the Kafka service
func Initialize(service kafka.KafkaService) {
	kafkaService = service
}

// UpdateBootstrapServer updates the bootstrap server for the Kafka service
func UpdateBootstrapServer(bootstrapServer string) {
	log.Printf("UpdateBootstrapServer called with: %s", bootstrapServer)

	// If the server is localhost, use 127.0.0.1 instead
	if strings.HasPrefix(bootstrapServer, "localhost:") {
		port := strings.Split(bootstrapServer, ":")[1]
		bootstrapServer = "127.0.0.1:" + port
		log.Printf("Converted localhost to 127.0.0.1: %s", bootstrapServer)
	}

	// Create a new Kafka client with the updated broker address
	newClient := kafka.NewKafkaClient(bootstrapServer)
	// Update the global kafkaService with the new client
	kafkaService = newClient
	log.Printf("Kafka client updated with new broker: %s", bootstrapServer)
}

func GetTopics(c *gin.Context) {
	bootstrapServer := c.Query("bootstrapServer")
	if bootstrapServer != "" {
		UpdateBootstrapServer(bootstrapServer)
	}

	topics, err := kafkaService.ListTopics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, topics)
}

func GetMessages(c *gin.Context) {
	bootstrapServer := c.Query("bootstrapServer")
	if bootstrapServer != "" {
		UpdateBootstrapServer(bootstrapServer)
	}

	topic := c.Param("name")
	limitStr := c.DefaultQuery("limit", "5")
	limit, _ := strconv.Atoi(limitStr)
	sortOrder := c.DefaultQuery("sort", "newest")

	log.Printf("Attempting to fetch messages for topic: %s with limit: %d and sort: %s", topic, limit, sortOrder)

	messages, err := kafkaService.FetchMessages(topic, limit, sortOrder)
	if err != nil {
		log.Printf("Error fetching messages: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   err.Error(),
			"details": fmt.Sprintf("Failed to fetch messages for topic %s: %v", topic, err),
		})
		return
	}

	log.Printf("Successfully fetched %d messages for topic: %s", len(messages), topic)
	c.JSON(http.StatusOK, messages)
}

func ProduceMessage(c *gin.Context) {
	bootstrapServer := c.Query("bootstrapServer")
	if bootstrapServer != "" {
		UpdateBootstrapServer(bootstrapServer)
	}

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
	bootstrapServer := c.Query("bootstrapServer")
	if bootstrapServer != "" {
		UpdateBootstrapServer(bootstrapServer)
	}

	topic := c.Param("name")
	log.Printf("Attempting to delete messages for topic: %s", topic)

	if err := kafkaService.DeleteAndRecreateTopic(topic); err != nil {
		log.Printf("Error deleting messages: %v", err)
		if strings.Contains(err.Error(), "topic does not exist") {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if strings.Contains(err.Error(), "messages still exist") {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete messages: " + err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete messages: " + err.Error()})
		return
	}

	log.Printf("Successfully deleted messages for topic: %s", topic)
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func DeleteTopic(c *gin.Context) {
	bootstrapServer := c.Query("bootstrapServer")
	if bootstrapServer != "" {
		UpdateBootstrapServer(bootstrapServer)
	}

	topic := c.Param("name")
	if err := kafkaService.DeleteTopic(topic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func CreateTopic(c *gin.Context) {
	bootstrapServer := c.Query("bootstrapServer")
	if bootstrapServer != "" {
		UpdateBootstrapServer(bootstrapServer)
	}

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
		log.Printf("Error creating topic: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func GetPartitionInfo(c *gin.Context) {
	bootstrapServer := c.Query("bootstrapServer")
	if bootstrapServer != "" {
		UpdateBootstrapServer(bootstrapServer)
	}

	topic := c.Param("name")
	partitions, err := kafkaService.GetPartitionInfo(topic)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, partitions)
}

func GetBrokers(c *gin.Context) {
	bootstrapServer := c.Query("bootstrapServer")
	if bootstrapServer != "" {
		UpdateBootstrapServer(bootstrapServer)
	}

	brokers, err := kafkaService.GetBrokers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, brokers)
}

func GetConsumers(c *gin.Context) {
	bootstrapServer := c.Query("bootstrapServer")
	if bootstrapServer != "" {
		UpdateBootstrapServer(bootstrapServer)
	}

	consumers, err := kafkaService.GetConsumers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, consumers)
}

func CheckConnection(c *gin.Context) {
	bootstrapServer := c.Query("bootstrapServer")
	log.Printf("CheckConnection received bootstrapServer: %s", bootstrapServer)

	if bootstrapServer != "" {
		UpdateBootstrapServer(bootstrapServer)
	}

	if client, ok := kafkaService.(*kafka.KafkaClient); ok {
		err := client.CheckConnection()
		if err != nil {
			log.Printf("Connection check failed: %v", err)
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":     err.Error(),
				"connected": false,
			})
			return
		}
		log.Printf("Connection check successful for broker: %s", bootstrapServer)
		c.JSON(http.StatusOK, gin.H{
			"connected": true,
			"message":   "Successfully connected to Kafka broker",
		})
	} else {
		log.Printf("Invalid Kafka client type")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":     "Invalid Kafka client type",
			"connected": false,
		})
	}
}
