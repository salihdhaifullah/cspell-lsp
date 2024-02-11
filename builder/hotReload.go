package builder

import (
	"fmt"
	"log"
	"net/http"
)

func HandelHotReload(handel func()) chan struct{} {
	events := make(chan struct{})

	http.HandleFunc("/events", func(w http.ResponseWriter, r *http.Request) {
		// Add headers needed for server-sent events (SSE):
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		flusher, ok := w.(http.Flusher)
		if !ok {
		  log.Fatalln("Your browser does not support server-sent events (SSE).")
		  return
		}
		for {
		  select {
		  case <-events:
			// NOTE: I needed to add "data" to get server-sent events to work. YMMV.

			handel()
			fmt.Fprintf(w, "event: reload\ndata\n\n")
			flusher.Flush()
		  case <-r.Context().Done():
			// No-op
			return
		  }
		}
	  })

	return events
}
