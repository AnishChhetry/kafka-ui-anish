package kafka

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/IBM/sarama"
	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

var broker string

// KafkaClient implements the KafkaService interface
type KafkaClient struct {
	broker string
	admin  sarama.ClusterAdmin
}

// NewKafkaClient creates a new instance of KafkaClient
func NewKafkaClient(brokerAddr string) *KafkaClient {
	admin, err := sarama.NewClusterAdmin([]string{brokerAddr}, sarama.NewConfig())
	if err != nil {
		admin = nil
	}
	return &KafkaClient{
		broker: brokerAddr,
		admin:  admin,
	}
}

// UpdateBroker updates the broker address
func (k *KafkaClient) UpdateBroker(brokerAddr string) {
	k.broker = brokerAddr
}

// ListTopics returns a list of all topics in the Kafka cluster
func (k *KafkaClient) ListTopics() ([]Topic, error) {
	config := &kafka.ConfigMap{
		"bootstrap.servers":       k.broker,
		"client.id":               "kafka-ui-list-topics",
		"socket.timeout.ms":       5000,
		"broker.address.family":   "v4", // Force IPv4
		"socket.keepalive.enable": true,
	}

	admin, err := kafka.NewAdminClient(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create admin client: %v", err)
	}
	defer admin.Close()

	md, err := admin.GetMetadata(nil, false, 5000)
	if err != nil {
		return nil, fmt.Errorf("failed to get metadata: %v", err)
	}

	topics := []Topic{}
	for _, t := range md.Topics {
		// Skip internal topics
		// if strings.HasPrefix(t.Topic, "__") {
		// 	continue
		// }

		// Get partition information
		partitions := []Partition{}
		for _, p := range t.Partitions {
			partitions = append(partitions, Partition{
				ID:              int(p.ID),
				Leader:          int(p.Leader),
				Replicas:        convertReplicas(p.Replicas),
				InSyncReplicas:  convertReplicas(p.Isrs),
				OfflineReplicas: []int{}, // Not available in the library
			})
		}

		topics = append(topics, Topic{
			Name:           t.Topic,
			Partitions:     partitions,
			ConsumerGroups: []ConsumerGroup{},
			Internal:       false,
			PartitionCount: len(partitions),
			ReplicationFactor: func() int {
				if len(partitions) > 0 {
					return len(partitions[0].Replicas)
				}
				return 0
			}(),
		})
	}

	return topics, nil
}

// FetchMessages reads a limited number of messages from the given topic
func (k *KafkaClient) FetchMessages(topic string, limit int, sortOrder string) ([]Message, error) {
	consumer, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers":       k.broker,
		"group.id":                fmt.Sprintf("temp-meta-%d", time.Now().UnixNano()),
		"auto.offset.reset":       "earliest",
		"broker.address.family":   "v4",
		"socket.timeout.ms":       5000,
		"socket.keepalive.enable": true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create consumer: %v", err)
	}
	defer consumer.Close()

	// Get topic metadata
	metadata, err := consumer.GetMetadata(&topic, false, 5000)
	if err != nil {
		return nil, fmt.Errorf("failed to get metadata: %v", err)
	}

	if len(metadata.Topics) == 0 || len(metadata.Topics[topic].Partitions) == 0 {
		return nil, fmt.Errorf("topic %s not found or has no partitions", topic)
	}

	// Get partition information
	partitions := metadata.Topics[topic].Partitions

	msgChan := make(chan []Message, len(partitions))
	errChan := make(chan error, len(partitions))

	var wg sync.WaitGroup

	for _, p := range partitions {
		wg.Add(1)
		go func(partition kafka.PartitionMetadata) {
			defer wg.Done()

			partitionConfig := &kafka.ConfigMap{
				"bootstrap.servers":       k.broker,
				"group.id":                fmt.Sprintf("temp-consumer-%d-%d", time.Now().UnixNano(), partition.ID),
				"auto.offset.reset":       "earliest",
				"enable.auto.commit":      false,
				"broker.address.family":   "v4",
				"socket.timeout.ms":       5000,
				"socket.keepalive.enable": true,
			}

			partitionConsumer, err := kafka.NewConsumer(partitionConfig)
			if err != nil {
				errChan <- fmt.Errorf("partition %d: failed to create consumer: %v", partition.ID, err)
				return
			}
			defer partitionConsumer.Close()

			low, high, err := partitionConsumer.QueryWatermarkOffsets(topic, partition.ID, 5000)
			if err != nil {
				if err.(kafka.Error).Code() == kafka.ErrUnknownPartition {
					msgChan <- []Message{} // Send empty messages for non-existent partition
					return
				}
				errChan <- fmt.Errorf("partition %d: failed to query watermark offsets: %v", partition.ID, err)
				return
			}

			if low == high {
				msgChan <- []Message{} // Send empty messages for empty partition
				return
			}

			start := high - int64(limit*5)
			if start < low {
				start = low
			}

			tp := kafka.TopicPartition{
				Topic:     &topic,
				Partition: partition.ID,
				Offset:    kafka.Offset(start),
			}

			err = partitionConsumer.Assign([]kafka.TopicPartition{tp})
			if err != nil {
				errChan <- fmt.Errorf("partition %d: failed to assign partition: %v", partition.ID, err)
				return
			}

			partitionMessages := []Message{}
			timeoutCount := 0

			for len(partitionMessages) < limit*5 {
				ev := partitionConsumer.Poll(200)
				if ev == nil {
					timeoutCount++
					if timeoutCount >= 5 {
						break
					}
					continue
				}

				switch msg := ev.(type) {
				case *kafka.Message:
					headers := make([]MessageHeader, len(msg.Headers))
					for i, h := range msg.Headers {
						headers[i] = MessageHeader{
							Key:   h.Key,
							Value: string(h.Value),
						}
					}
					partitionMessages = append(partitionMessages, Message{
						Topic:     topic,
						Partition: msg.TopicPartition.Partition,
						Offset:    int64(msg.TopicPartition.Offset),
						Key:       string(msg.Key),
						Value:     string(msg.Value),
						Timestamp: msg.Timestamp.UnixMilli(),
						Headers:   headers,
					})
					timeoutCount = 0
				case kafka.Error:
					if msg.Code() != kafka.ErrTimedOut {
						errChan <- fmt.Errorf("partition %d: consumer error: %v", partition.ID, msg)
						return
					}
				}
			}

			msgChan <- partitionMessages
		}(p)
	}

	wg.Wait()
	close(msgChan)
	close(errChan)

	for err := range errChan {
		if err != nil {
			return nil, err
		}
	}

	allMessages := []Message{}
	for msgs := range msgChan {
		allMessages = append(allMessages, msgs...)
	}

	// Sort messages based on sortOrder
	if sortOrder == "newest" {
		sort.Slice(allMessages, func(i, j int) bool {
			return allMessages[i].Timestamp > allMessages[j].Timestamp
		})
	} else {
		sort.Slice(allMessages, func(i, j int) bool {
			return allMessages[i].Timestamp < allMessages[j].Timestamp
		})
	}

	// Limit the number of messages
	if len(allMessages) > limit {
		allMessages = allMessages[:limit]
	}

	return allMessages, nil
}

// Produce sends a message to the given Kafka topic
func (k *KafkaClient) Produce(topic, key string, value []byte, partition int32, headers []MessageHeader) error {
	producer, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers":       k.broker,
		"client.id":               "kafka-ui-producer",
		"socket.timeout.ms":       5000,
		"broker.address.family":   "v4",
		"socket.keepalive.enable": true,
		"retries":                 3,
		"retry.backoff.ms":        100,
		"message.timeout.ms":      5000,
		"acks":                    "all", // Wait for all replicas to acknowledge
		"enable.idempotence":      true,  // Prevent duplicate messages
	})
	if err != nil {
		return fmt.Errorf("failed to create producer: %v", err)
	}
	defer producer.Close()

	// Convert headers to Kafka headers
	kafkaHeaders := make([]kafka.Header, len(headers))
	for i, h := range headers {
		kafkaHeaders[i] = kafka.Header{
			Key:   h.Key,
			Value: []byte(h.Value),
		}
	}

	msg := &kafka.Message{
		TopicPartition: kafka.TopicPartition{
			Topic:     &topic,
			Partition: partition,
		},
		Key:     []byte(key),
		Value:   value,
		Headers: kafkaHeaders,
	}

	// Create a delivery channel
	deliveryChan := make(chan kafka.Event, 1)

	// Produce the message
	err = producer.Produce(msg, deliveryChan)
	if err != nil {
		return fmt.Errorf("failed to produce message: %v", err)
	}

	// Wait for delivery report
	ev := <-deliveryChan
	msgEvent := ev.(*kafka.Message)

	if msgEvent.TopicPartition.Error != nil {
		return fmt.Errorf("delivery failed: %v", msgEvent.TopicPartition.Error)
	}

	return nil
}

// DeleteAndRecreateTopic deletes and recreates a topic
func (k *KafkaClient) DeleteAndRecreateTopic(topic string) error {
	// First, delete the topic
	if err := k.DeleteTopic(topic); err != nil {
		return fmt.Errorf("failed to delete topic: %v", err)
	}

	// Wait a moment for the deletion to propagate
	time.Sleep(2 * time.Second)

	// Create the topic with proper configuration
	if err := k.CreateTopic(topic, 1, 1); err != nil {
		return fmt.Errorf("failed to create topic: %v", err)
	}

	// Wait a moment for the creation to propagate
	time.Sleep(2 * time.Second)

	// Verify the topic was created properly
	admin, err := kafka.NewAdminClient(&kafka.ConfigMap{
		"bootstrap.servers":     k.broker,
		"broker.address.family": "v4",
	})
	if err != nil {
		return fmt.Errorf("failed to create admin client: %v", err)
	}
	defer admin.Close()

	// Get topic metadata
	md, err := admin.GetMetadata(&topic, false, 5000)
	if err != nil {
		return fmt.Errorf("failed to get metadata: %v", err)
	}

	if len(md.Topics) == 0 || len(md.Topics[topic].Partitions) == 0 {
		return fmt.Errorf("topic %s was not created properly", topic)
	}

	// Verify each partition has a leader
	for _, p := range md.Topics[topic].Partitions {
		if p.Leader == -1 {
			return fmt.Errorf("partition %d has no leader", p.ID)
		}
	}

	return nil
}

// DeleteTopic deletes a Kafka topic
func (k *KafkaClient) DeleteTopic(topic string) error {
	admin, err := kafka.NewAdminClient(&kafka.ConfigMap{"bootstrap.servers": k.broker})
	if err != nil {
		return err
	}
	defer admin.Close()

	_, err = admin.DeleteTopics(context.Background(), []string{topic})
	return err
}

// CreateTopic creates a new Kafka topic
func (k *KafkaClient) CreateTopic(name string, partitions int, replicationFactor int) error {
	admin, err := kafka.NewAdminClient(&kafka.ConfigMap{"bootstrap.servers": k.broker})
	if err != nil {
		return err
	}
	defer admin.Close()

	results, err := admin.CreateTopics(context.Background(), []kafka.TopicSpecification{{
		Topic:             name,
		NumPartitions:     partitions,
		ReplicationFactor: replicationFactor,
	}})
	if err != nil {
		return fmt.Errorf("failed to create topic: %v", err)
	}

	// Check for errors in the results
	for _, result := range results {
		if result.Error.Code() != kafka.ErrNoError {
			return fmt.Errorf("failed to create topic %s: %v", name, result.Error)
		}
	}

	return nil
}

// GetPartitionInfo gets information about partitions for a topic
func (k *KafkaClient) GetPartitionInfo(topic string) ([]PartitionInfo, error) {
	admin, err := kafka.NewAdminClient(&kafka.ConfigMap{"bootstrap.servers": k.broker})
	if err != nil {
		return nil, err
	}
	defer admin.Close()

	md, err := admin.GetMetadata(&topic, false, 1000)
	if err != nil {
		return nil, err
	}

	partitions := []PartitionInfo{}
	for _, p := range md.Topics[topic].Partitions {
		partitions = append(partitions, PartitionInfo{
			Topic:          topic,
			Partition:      p.ID,
			Leader:         p.Leader,
			Replicas:       p.Replicas,
			InSyncReplicas: p.Isrs,
		})
	}
	return partitions, nil
}

// BrokerInfo represents information about a Kafka broker
type BrokerInfo struct {
	ID           int    `json:"id"`
	Address      string `json:"address"`
	Status       string `json:"status"`
	SegmentSize  int64  `json:"segmentSize"`
	SegmentCount int    `json:"segmentCount"`
	Replicas     []int  `json:"replicas"`
	Leaders      []int  `json:"leaders"`
}

// ConsumerGroupInfo struct for minimal group member info
// Only GroupID, MemberID, Topics, Partitions, Error
type ConsumerGroupInfo struct {
	GroupID    string   `json:"groupId"`
	MemberID   string   `json:"memberId"`
	Topics     []string `json:"topics"`
	Partitions []int32  `json:"partitions"`
	Error      string   `json:"error"`
}

// GetBrokers returns a list of all brokers in the Kafka cluster
func (k *KafkaClient) GetBrokers() ([]BrokerInfo, error) {
	admin, err := kafka.NewAdminClient(&kafka.ConfigMap{"bootstrap.servers": k.broker})
	if err != nil {
		return nil, err
	}
	defer admin.Close()

	md, err := admin.GetMetadata(nil, true, 5000)
	if err != nil {
		return nil, err
	}

	// Get all topic configs to fetch segment.bytes
	topics := make([]string, 0)
	for topicName := range md.Topics {
		topics = append(topics, topicName)
	}

	topicConfigs := make(map[string]string)
	for _, topic := range topics {
		configs := []kafka.ConfigResource{{
			Type: kafka.ResourceTopic,
			Name: topic,
		}}
		resp, err := admin.DescribeConfigs(context.Background(), configs)
		if err == nil && len(resp) > 0 {
			for _, entry := range resp[0].Config {
				if entry.Name == "segment.bytes" {
					topicConfigs[topic] = entry.Value
				}
			}
		}
	}

	brokers := make([]BrokerInfo, 0)
	for _, b := range md.Brokers {
		host := b.Host
		port := b.Port
		address := fmt.Sprintf("%s:%d", host, port)

		leaders := make([]int, 0)
		replicas := make([]int, 0)
		segmentSize := int64(0)
		segmentCount := 0

		for topicName, topicMeta := range md.Topics {
			for _, p := range topicMeta.Partitions {
				if int(p.Leader) == int(b.ID) {
					leaders = append(leaders, int(p.ID))

					// Use real segment.bytes if available
					// have to fix this
					segSize, err := strconv.ParseInt(topicConfigs[topicName], 10, 64)
					if err != nil {
						segSize = 1024 * 1024 // fallback default
					}
					segmentSize += segSize
					segmentCount += 1
				}

				for _, r := range p.Replicas {
					if int(r) == int(b.ID) {
						replicas = append(replicas, int(p.ID))
					}
				}
			}
		}

		brokers = append(brokers, BrokerInfo{
			ID:           int(b.ID),
			Address:      address,
			Status:       "online", // static, unless you monitor JMX/metrics
			SegmentSize:  segmentSize,
			SegmentCount: segmentCount,
			Replicas:     replicas,
			Leaders:      leaders,
		})
	}

	return brokers, nil
}

// GetConsumers gets information about consumer groups
func (k *KafkaClient) GetConsumers() ([]ConsumerGroupInfo, error) {
	if k.admin == nil {
		return nil, fmt.Errorf("sarama admin client not initialized")
	}
	groups, err := k.admin.ListConsumerGroups()
	if err != nil {
		return nil, err
	}
	var infos []ConsumerGroupInfo
	for groupID := range groups {
		desc, err := k.admin.DescribeConsumerGroups([]string{groupID})
		if err != nil || len(desc) == 0 {
			continue
		}
		cg := desc[0]
		for _, member := range cg.Members {
			assignment, err := member.GetMemberAssignment()
			if err != nil {
				infos = append(infos, ConsumerGroupInfo{
					GroupID:    groupID,
					MemberID:   member.MemberId,
					Topics:     []string{},
					Partitions: []int32{},
					Error:      err.Error(),
				})
				continue
			}
			var topics []string
			var partitions []int32
			for topic, parts := range assignment.Topics {
				topics = append(topics, topic)
				partitions = append(partitions, parts...)
			}
			infos = append(infos, ConsumerGroupInfo{
				GroupID:    groupID,
				MemberID:   member.MemberId,
				Topics:     topics,
				Partitions: partitions,
				Error:      "",
			})
		}
	}
	return infos, nil
}

// Global functions that use the default client
var defaultClient = NewKafkaClient(broker)

func ListTopics() ([]Topic, error) {
	return defaultClient.ListTopics()
}

func FetchMessages(topic string, limit int, sortOrder string) ([]Message, error) {
	return defaultClient.FetchMessages(topic, limit, sortOrder)
}

func Produce(topic, key string, value []byte, partition int32, headers []MessageHeader) error {
	return defaultClient.Produce(topic, key, value, partition, headers)
}

func DeleteAndRecreateTopic(topic string) error {
	return defaultClient.DeleteAndRecreateTopic(topic)
}

func DeleteTopic(topic string) error {
	return defaultClient.DeleteTopic(topic)
}

func CreateTopic(name string, partitions int, replicationFactor int) error {
	return defaultClient.CreateTopic(name, partitions, replicationFactor)
}

func GetPartitionInfo(topic string) ([]PartitionInfo, error) {
	return defaultClient.GetPartitionInfo(topic)
}

func GetBrokers() ([]BrokerInfo, error) {
	return defaultClient.GetBrokers()
}

func GetConsumers() ([]ConsumerGroupInfo, error) {
	return defaultClient.GetConsumers()
}

// GetTopics returns a list of all topics in the Kafka cluster
func (k *KafkaClient) GetTopics() ([]Topic, error) {
	admin, err := kafka.NewAdminClient(&kafka.ConfigMap{"bootstrap.servers": k.broker})
	if err != nil {
		return nil, err
	}
	defer admin.Close()

	md, err := admin.GetMetadata(nil, false, 5000)
	if err != nil {
		return nil, err
	}

	topics := []Topic{}
	for _, t := range md.Topics {
		// Skip internal topics
		if strings.HasPrefix(t.Topic, "__") {
			continue
		}

		// Get partition information
		partitions := []Partition{}
		for _, p := range t.Partitions {
			partitions = append(partitions, Partition{
				ID:              int(p.ID),
				Leader:          int(p.Leader),
				Replicas:        convertReplicas(p.Replicas),
				InSyncReplicas:  convertReplicas(p.Isrs),
				OfflineReplicas: []int{}, // Not available in the library
			})
		}

		topics = append(topics, Topic{
			Name:           t.Topic,
			Partitions:     partitions,
			ConsumerGroups: []ConsumerGroup{},
			Internal:       false,
			PartitionCount: len(partitions),
			ReplicationFactor: func() int {
				if len(partitions) > 0 {
					return len(partitions[0].Replicas)
				}
				return 0
			}(),
		})
	}

	return topics, nil
}

// CheckConnection verifies if the connection to Kafka is working
func (k *KafkaClient) CheckConnection() error {
	config := &kafka.ConfigMap{
		"bootstrap.servers":        k.broker,
		"client.id":                "kafka-ui-connection-check",
		"socket.timeout.ms":        5000,
		"broker.address.family":    "v4", // Force IPv4
		"socket.keepalive.enable":  true,
		"reconnect.backoff.ms":     100,
		"reconnect.backoff.max.ms": 1000,
		"retries":                  3,
	}

	admin, err := kafka.NewAdminClient(config)
	if err != nil {
		return fmt.Errorf("failed to create admin client: %v", err)
	}
	defer admin.Close()

	// Try to get metadata to verify connection
	_, err = admin.GetMetadata(nil, false, 5000)
	if err != nil {
		return fmt.Errorf("failed to get metadata: %v", err)
	}

	return nil
}
