package main

import (
	"log"
	"net/http"
	"os"

	"github.com/salihdhaifullah/go-react-ssr/builder"
	v8 "rogchap.com/v8go"
)

func main() {
	events := HandelHotReload()

	builder.Build(events)

	http.Handle("/public/", http.StripPrefix("/public/", http.FileServer(http.Dir("./build/client"))))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		log.Println("handel client runs ok")
		strx := NewRenderer()
		byteToW := []byte(strx)
		_, err := w.Write(byteToW)
		if err != nil {
			log.Fatal(err)
		}
	})

	log.Fatal(http.ListenAndServe(":8080", nil))
}

// type Renderer struct {
// iso    *v8.Isolate
// ctx    *quickjs.Context
// global quickjs.Value
// }

func NewRenderer() string {
	iso := v8.NewIsolate()

	b, err := os.ReadFile("./build/server/script.js")
	if err != nil {
		log.Println("1")
		log.Fatal(err)
	}

	res, err := iso.CompileUnboundScript(string(b), "hello", v8.CompileOptions{})

	if err != nil {
		log.Println("3")
		log.Fatal(err)
	}

	ctx := v8.NewContext(iso)
	_, err = res.Run(ctx)
	if err != nil {
		log.Println("3")
		log.Fatal(err)
	}

	global := ctx.Global()

	args, err := v8.NewValue(iso, "/")
	if err != nil {
		log.Println("2")
		log.Fatal(err)
	}

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

	val, err := f.Call(global, args)

	if err != nil {
		log.Fatal(err)
	}

	return val.String()
}

// func (this Renderer) RenderHtml() quickjs.Value {
// 	// names, err := this.global.PropertyNames()
// 	// if err != nil {
// 	// log.Println("3")
// 	// log.Fatal(err)
// 	// }
// 	// log.Println(names)
// 	Redr := this.global.Get("RenderHtml")
// 	Res2 := this.ctx.JsFunction(this.global, Redr, []quickjs.Value{this.ctx.String("/")})
// 	err2 := this.global.Error()
// 	err3 := this.ctx.Exception()
// 	val := Res2.String()
// 	log.Println(val)
// 	log.Println(err2)
// 	log.Println(err3)
// 	// var html string = Res2.String()
// 	// go Res2.Free()
// 	// go res.Free()
// 	return Res2
// }

// func (this Renderer) Free() {
// 	this.global.Free()
// 	this.ctx.Free()
// 	this.runtime.Free()
// }
