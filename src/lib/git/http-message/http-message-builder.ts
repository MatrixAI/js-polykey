class HttpMessageBuilder {
  statusCode: number = 200
  headers: Map<string, string> = new Map()
  body: string[] = []

  private statusMessages = {
    200: 'OK',
    400: 'Bad Request',
    404: 'Not Found',
    405: 'Method Not Allowed',
  }

  addHeader(name: string, value: string) {
    this.headers.set(name, value)
  }

  appendToBody(content: string) {
    this.body.push(content)
  }

  build(): Buffer {
    let response = ''

    response += `HTTP/1.1 ${this.statusCode} ${this.statusMessages[this.statusCode]}\n`
    for (const [key, value] of this.headers) {
      response += `${key}: ${value}\n`
    }
    response += `Connection: close\n`
    if (this.body.length == 0) {

    } else if (this.body.length < 2) {
      response += `Content-Length: ${this.body.length}\n`
      response += '\n'
      response += this.body
    } else {
      response += `Transfer-Encoding: chunked\n`
      response += '\n'
      for (const line in this.body) {
        response += `${line.length.toString(16)}\n`
        response += `${line}\n`
      }
    }

    return Buffer.from(response)
  }
}

export default HttpMessageBuilder


// async function main() {
//   const message = new HttpMessageBuilder()
//   console.log(message.build().toString());


// }

// main()
