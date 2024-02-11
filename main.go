package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/salihdhaifullah/go-react-ssr/builder"
	v8 "rogchap.com/v8go"
)


type Person struct {
	Name string `json:"name"`
	Age int `json:"age"`
}

func Loader(url string) Props {
	switch url {
	case "/":
		return Props{Ok: true,
		Data: Person{
			Name: "Salih Dhaifullah",
			Age: 19,
		},}
	default:
		return Props{Ok: true}
	}
}

type Props struct {
	Ok bool `json:"ok"`
	Data interface{} `json:"data"`
}

func MustStringfiy(data interface{}) string {
	byt, err := json.Marshal(data)
	if err != nil {
		log.Fatal(err)
	}

	return string(byt)
}


var RendererX Renderer
var RendererMutex = sync.Mutex{}

func main() {
	handel := func () {
		RendererMutex.Lock()
		RendererX.Free()
		RendererX = NewRenderer()
		RendererMutex.Unlock()
	}


	events := builder.HandelHotReload(handel)
	builder.Build(events)
	RendererMutex.Lock()
	RendererX = NewRenderer()
	RendererMutex.Unlock()

	http.Handle("/public/", http.StripPrefix("/public/", http.FileServer(http.Dir("./build/client"))))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Println("handel client runs ok")

		RendererMutex.Lock()
		html := RendererX.RendererHtml(r.URL.Path, MustStringfiy(Loader(r.URL.Path)))
		RendererMutex.Unlock()

		_, err := w.Write([]byte(html))
		if err != nil {
			log.Fatal(err)
		}
	})


	log.Println("start server at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

type Renderer struct {
	iso    *v8.Isolate
	global *v8.Object
	fn     *v8.Function
	ctx *v8.Context
}

func (renderer Renderer) Free() {
	renderer.fn.Release()
	renderer.global.Release()
	renderer.iso.Dispose()
}

func NewRenderer() Renderer {
	iso := v8.NewIsolate()

	b, err := os.ReadFile("./build/server/script.js")
	if err != nil {
		log.Fatal(err)
	}

	res, err := iso.CompileUnboundScript(string(b), "input", v8.CompileOptions{})
	if err != nil {
		log.Fatal(err)
	}

	ctx := v8.NewContext(iso)
	resT, err := res.Run(ctx)
	if err != nil {
		log.Fatal(err)
	}
	resT.Release()

	global := ctx.Global()

	data, err := global.Get("RenderHtml")
	if err != nil {
		log.Fatal(err)
	}

	if !data.IsFunction() {
		log.Fatal("no function found named RenderHtml")
	}

	f, err := data.AsFunction()
	if err != nil {
		log.Fatal(err)
	}

	return Renderer{
		iso:    iso,
		global: global,
		fn:     f,
		ctx: ctx,
	}
}

func (renderer Renderer) RendererHtml(url string, props string) string {
	arg1, err := v8.NewValue(renderer.iso, props)
	if err != nil {
		log.Fatal(err)
	}
	defer arg1.Release()

	arg2, err := v8.NewValue(renderer.iso, url)
	if err != nil {
		log.Fatal(err)
	}
	defer arg2.Release()

	val, err := renderer.fn.Call(renderer.global, arg2, arg1)
	if err != nil {
		log.Fatal(err)
	}
	defer val.Release()

	return val.String()
}
