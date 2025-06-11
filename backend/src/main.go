package main

import (
	"log"
	"os"

	"backend/api"
	"backend/kafka"
	"backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Set Gin mode to debug
	gin.SetMode(gin.DebugMode)

	// Get Kafka broker address from environment variable or use default
	kafkaBroker := os.Getenv("KAFKA_BROKER")
	if kafkaBroker == "" {
		kafkaBroker = "127.0.0.1:9093" // Use explicit IPv4 address
	}
	log.Printf("Using Kafka broker: %s", kafkaBroker)

	// Initialize Kafka service
	kafkaClient := kafka.NewKafkaClient(kafkaBroker)

	// Test connection immediately
	if err := kafkaClient.CheckConnection(); err != nil {
		log.Printf("Warning: Initial Kafka connection test failed: %v", err)
	} else {
		log.Printf("Successfully connected to Kafka broker: %s", kafkaBroker)
	}

	api.Initialize(kafkaClient)

	r := gin.Default()

	// Add request logging
	r.Use(gin.Logger())

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	r.POST("/api/login", api.Login)

	apiRoutes := r.Group("/api")
	apiRoutes.Use(middleware.JWTMiddleware())
	{
		apiRoutes.GET("/check-connection", api.CheckConnection)
		apiRoutes.GET("/topics", api.GetTopics)
		apiRoutes.GET("/topics/:name/messages", api.GetMessages)
		apiRoutes.GET("/topics/:name/partitions", api.GetPartitionInfo)
		apiRoutes.POST("/produce", api.ProduceMessage)
		apiRoutes.DELETE("/topics/:name/messages", api.DeleteMessages)
		apiRoutes.DELETE("/topics/:name", api.DeleteTopic)
		apiRoutes.POST("/topics", api.CreateTopic)
		apiRoutes.GET("/consumers", api.GetConsumers)
		apiRoutes.GET("/brokers", api.GetBrokers)
		apiRoutes.POST("/change-password", api.ChangePassword)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
