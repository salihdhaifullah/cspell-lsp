import { useEffect, useState } from 'react'
import './App.css'
import { Props } from '.'

interface Person {
  name: string
  age: number
}

function App(props: Props<Person>) {
  useEffect(() => {
    console.log(props)
  }, [])

  const [count, setCount] = useState(0)
  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/public/go.svg" className="logo golang" alt="Golang logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src="/public/react.svg" className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Golang + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <h1>person name is {props.data.name}</h1>
        <h1>person age is {props.data.age}</h1>
        <h1>is ok {String(props.ok)}</h1>
      </div>
      <p className="read-the-docs">
        Click on the Golang and React logos to learn more
      </p>
    </>
  )
}

export default App
