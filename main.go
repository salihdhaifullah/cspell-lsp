package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	goja "github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/console"
	"github.com/dop251/goja_nodejs/require"
	"github.com/salihdhaifullah/go-react-ssr/builder"
)

type Person struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func Loader(url string) Props {
	switch url {
	case "/":
		data := []Person{}
		for i := 0; i < 100; i++ {
			data = append(data, Person{
				Name: "HELLO WORLD",
				Age:  i,
			})
		}
		return Props{Ok: true, Data: data}
	default:
		return Props{Ok: true}
	}
}

type Props struct {
	Ok   bool        `json:"ok"`
	Data interface{} `json:"data"`
}

func MustStringfiy(data interface{}) string {
	byt, err := json.Marshal(data)
	if err != nil {
		log.Fatal(err)
	}

	return string(byt)
}

func main() {
	rendererMutex := sync.Mutex{}
	var renderer Renderer

	handel := func() {
		rendererMutex.Lock()
		renderer = NewRenderer()
		rendererMutex.Unlock()
	}

	events := builder.HandelHotReload(handel)
	builder.Build(events)
	rendererMutex.Lock()
	renderer = NewRenderer()
	rendererMutex.Unlock()

	http.Handle("/public/", http.StripPrefix("/public/", http.FileServer(http.Dir("./build/client"))))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		log.Println("handel client runs ok")
		json := MustStringfiy(Loader(r.URL.Path))

		since := time.Now()
		rendererMutex.Lock()
		html := renderer.RenderHtml(r.URL.Path, json)
		rendererMutex.Unlock()
		log.Println(time.Since(since))

		_, err := w.Write([]byte(html))
		if err != nil {
			log.Fatal(err)
		}
	})

	log.Println("start server at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

type Renderer struct {
	RenderHtml func(string, string) string
}

func NewRenderer() Renderer {
	b, err := os.ReadFile("./build/server/script.js")
	if err != nil {
		log.Fatal(err)
	}

	rn := goja.New()
	new(require.Registry).Enable(rn)
	console.Enable(rn)
	_, err = rn.RunScript("input", string(b))
	if err != nil {
		log.Fatal(err)
	}

	var RenderHtml func(string, string) string
	err = rn.ExportTo(rn.Get("RenderHtml"), &RenderHtml)
	if err != nil {
		panic(err)
	}

	return Renderer{
		RenderHtml: RenderHtml,
	}
}
