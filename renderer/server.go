package renderer

import (
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
)

type FrontendBuild struct {
	FrontendDist fs.FS
	ServerDist   fs.FS
}

var (
	port = os.Getenv("PORT")
)

func init() {
	if port == "" {
		port = "8080"
	}
}

func RunBlocking(frontendBuild FrontendBuild) {

	serverEntry, err := readFSFile(frontendBuild.ServerDist, "entry-server.js")
	if err != nil {
		log.Fatal(err)
	}

	indexHTML, err := readFSFile(frontendBuild.FrontendDist, "index.html")
	if err != nil {
		log.Fatal(err)
	}

	ssr := NewRenderer(string(serverEntry))

	// handle static from dist/client
	http.Handle("/assets/", http.FileServer(http.FS(frontendBuild.FrontendDist)))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		output, err := ssr.Render(r.URL.Path)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(strings.Replace(string(indexHTML), "<!--app-html-->", output, 1)))
	})

	log.Printf("Started server on port %s", port)
	http.ListenAndServe(fmt.Sprintf(":%s", port), nil)
}

func readFSFile(f fs.FS, name string) ([]byte, error) {
	file, err := f.Open(name)

	if err != nil {
		return nil, err
	}

	contents, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	return contents, nil
}
