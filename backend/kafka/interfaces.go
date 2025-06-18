package kafka

import (
	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

// KafkaService defines the interface for all Kafka operations
type KafkaService interface {
	// Connection Operations
	CheckConnection() error

	// Topic Operations
	ListTopics() ([]Topic, error)
	CreateTopic(name string, partitions, replicationFactor int) error
	DeleteTopic(topic string) error
	GetPartitionInfo(topic string) ([]PartitionInfo, error)

	// Message Operations
	FetchMessages(topic string, limit int, sortOrder string) ([]Message, error)
	Produce(topic, key string, value []byte, partition int32, headers []MessageHeader) error
	DeleteAndRecreateTopic(topic string) error

	// Cluster Operations
	GetBrokers() ([]BrokerInfo, error)
	GetConsumers() ([]ConsumerGroupInfo, error)
}

// Message represents a Kafka message
type Message struct {
	Topic     string          `json:"topic"`
	Partition int32           `json:"partition"`
	Offset    int64           `json:"offset"`
	Key       string          `json:"key"`
	Value     string          `json:"value"`
	Timestamp int64           `json:"timestamp"`
	Headers   []MessageHeader `json:"headers"`
}

// MessageHeader represents a Kafka message header
type MessageHeader struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// PartitionInfo represents information about a Kafka partition
type PartitionInfo struct {
	Topic          string  `json:"topic"`
	Partition      int32   `json:"partition"`
	Leader         int32   `json:"leader"`
	Replicas       []int32 `json:"replicas"`
	InSyncReplicas []int32 `json:"inSyncReplicas"`
}

// Broker represents a Kafka broker
type Broker struct {
	ID   int32  `json:"id"`
	Host string `json:"host"`
	Port int32  `json:"port"`
}

// ConsumerGroup represents a Kafka consumer group
type ConsumerGroup struct {
	GroupID string   `json:"groupId"`
	State   string   `json:"state"`
	Members int      `json:"members"`
	Topics  []string `json:"topics"`
}

// Topic represents a Kafka topic
type Topic struct {
	Name              string          `json:"name"`
	Partitions        []Partition     `json:"partitions"`
	ConsumerGroups    []ConsumerGroup `json:"consumerGroups"`
	Internal          bool            `json:"internal"`
	PartitionCount    int             `json:"partitionCount"`
	ReplicationFactor int             `json:"replicationFactor"`
}

// Partition represents a Kafka topic partition
type Partition struct {
	ID              int   `json:"id"`
	Leader          int   `json:"leader"`
	Replicas        []int `json:"replicas"`
	InSyncReplicas  []int `json:"inSyncReplicas"`
	OfflineReplicas []int `json:"offlineReplicas"`
}

// convertReplicas converts Kafka broker IDs to integers
func convertReplicas(replicas []int32) []int {
	result := make([]int, len(replicas))
	for i, r := range replicas {
		result[i] = int(r)
	}
	return result
}

// GetConsumerGroups returns a list of consumer groups for a topic
func (k *KafkaClient) GetConsumerGroups(topic string) ([]ConsumerGroup, error) {
	admin, err := kafka.NewAdminClient(&kafka.ConfigMap{"bootstrap.servers": k.broker})
	if err != nil {
		return nil, err
	}
	defer admin.Close()

	// For now, return an empty list since we can't easily get consumer groups
	// This is a limitation of the confluent-kafka-go library
	return []ConsumerGroup{}, nil
}
