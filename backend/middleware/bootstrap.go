package middleware

import (
	"backend/kafka"

	"github.com/gin-gonic/gin"
)

var kafkaService kafka.KafkaService

// SetKafkaService sets the Kafka service for the middleware
func SetKafkaService(service kafka.KafkaService) {
	kafkaService = service
}

// BootstrapMiddleware handles bootstrap server updates
func BootstrapMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		bootstrapServer := c.Query("bootstrapServer")
		if bootstrapServer != "" {
			// Create a new Kafka client with the provided broker address
			newClient := kafka.NewKafkaClient(bootstrapServer)
			// Update the global kafkaService with the new client
			kafkaService = newClient
		}
		c.Next()
	}
}
