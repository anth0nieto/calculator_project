package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"calculator/internal/httpapi"
)

func main() {
	port := flag.String("port", "8080", "port to listen on")
	flag.Parse()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /calculate", httpapi.HandleCalculator)

	addr := fmt.Sprintf(":%s", *port)
	log.Printf("Calculator server listening on http://localhost%s\n", addr)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server error: %v\n", err)
	}
}
