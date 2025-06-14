package main

import (
	"log"
	"os"

	"backend/api"
	"backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Set Gin mode to release in production
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize API and middleware
	api.Initialize(nil)             // Initialize with nil since we don't have a default broker
	middleware.SetKafkaService(nil) // Set nil initially

	r := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// Public routes (no bootstrap server required)
	r.POST("/api/login", api.Login)

	// Protected routes that require bootstrap server configuration
	apiRoutes := r.Group("/api")
	apiRoutes.Use(middleware.JWTMiddleware())
	apiRoutes.Use(middleware.BootstrapMiddleware())
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
