package main

import (
	"log"
	"net/http"
	"os"

	"github.com/quickjs-go/quickjs-go"
	"github.com/salihdhaifullah/go-react-ssr/builder"
)

//
// TODO: in dev mode use nodejs and vite for better DX

func main() {
	builder.Build()
	renderer := NewRenderer()

	// http.Handle("/static", http.FileServer(http.Dir("./build/client")))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		log.Println("handel client runs ok")
		strx := renderer.RenderHtml()

		byteToW := []byte(strx.String())
		_, err := w.Write(byteToW)
		if err != nil {
			log.Fatal(err)
		}

		strx.Free()
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
}



type Renderer struct {
	runtime quickjs.Runtime
	ctx *quickjs.Context
	global quickjs.Value

}

func NewRenderer() *Renderer {
	runtime := quickjs.NewRuntime()
	// runtime.StdFreeHandlers()
	ctx := runtime.NewContext()
	ctx.InitOsModule()
	ctx.InitStdModule()

	b, err := os.ReadFile("./build/server/script.js")
	if err != nil {
		log.Println("3")
		log.Fatal(err)
	}

	_, err = ctx.Eval(string(b), quickjs.EVAL_GLOBAL)
	if err != nil {
		log.Println("3")
		log.Fatal(err)
	}

	global := ctx.Globals()

	return &Renderer{
		global: global,
		runtime: runtime,
		ctx: ctx,
	}
}

func (this Renderer) RenderHtml() quickjs.Value {
	// names, err := this.global.PropertyNames()
	// if err != nil {
		// log.Println("3")
		// log.Fatal(err)
	// }
	// log.Println(names)
	Redr := this.global.Get("RenderHtml")
	Res2 := this.ctx.JsFunction(this.global, Redr, []quickjs.Value{this.ctx.String("/")})
	err2 := this.global.Error()
	err3 := this.ctx.Exception()
	val := Res2.String()
	log.Println(val)
	log.Println(err2)
	log.Println(err3)
	// var html string = Res2.String()
	// go Res2.Free()
	// go res.Free()
	return Res2
}

func (this Renderer) Free() {
	this.global.Free()
	this.ctx.Free()
	this.runtime.Free()
}

