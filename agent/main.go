package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

func publishLog(rdb *redis.Client, ctx context.Context, level, messageText string) {
	hostname, _ := os.Hostname()
	timestamp := time.Now().UTC().Format(time.RFC3339)

	logMessage := fmt.Sprintf("%s %s %s: %s", timestamp, hostname, level, messageText)

	err := rdb.Publish(ctx, "logs", logMessage).Err()
	if err != nil {
		log.Printf("Failed to publish log: %v", err)
	} else {
		log.Printf("Published: %s", logMessage)
	}
}
func main() {
	redisAddr := "redis:6379"

	// Connect to Redis
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})
	ctx := context.Background()

	// Check the connection
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}

	log.Println("Go Agent connected to Redis. Starting to send logs...")

	// Simulate log generation
	for {
		// Create a fake log message
		if rand.Intn(5) == 0 {
			log.Println(">>>Starting Error burst...")

			for i := 0; i < 4; i++ {
				publishLog(rdb, ctx, "ERROR", "FAILED to connect")
				time.Sleep(1 * time.Second)
			}
			log.Println("<<<Finished ERROR burst.")

		} else {
			publishLog(rdb, ctx, "INFO", "USER logged in successfully")

			// Wait for a random interval
			time.Sleep(time.Duration(2+rand.Intn(3)) * time.Second)
		}
	}
}
