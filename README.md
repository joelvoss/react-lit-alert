# @react-lit/alert

An alert is an element that displays a brief, important message in a way that
attracts the user's attention without interrupting the user's task.

Dynamically rendered alerts are automatically announced by most screen readers,
and in some operating systems, they may trigger an alert sound. It is important
to note that, at this time, screen readers do not inform users of alerts that
are present on the page before page load completes.

## Installation

```bash
$ npm i @react-lit/alert
# or
$ yarn add @react-lit/alert
```

## Example

```js
import * as React from 'react';
import { Alert } from "@react-lit/alert";

function Example() {
  const [messages, setMessages] = React.useState([]);
  return (
    <div>
      <button
        onClick={() => {
          setMessages((prevMessages) =>
            prevMessages.concat([`Message #${prevMessages.length + 1}`])
          );
          setTimeout(() => {
            setMessages((prevMessages) => prevMessages.slice(1));
          }, 5000);
        }}
      >
        Add a message
      </button>
      <div>
        {messages.map((message, index) => (
          <Alert key={index}>{message}</Alert>
        ))}
      </div>
    </div>
  );
}
```

## Development

(1) Install dependencies

```bash
$ npm i
# or
$ yarn
```

(2) Run initial validation

```bash
$ ./Taskfile.sh validate
```

(3) Run tests in watch-mode to validate functionality.

```bash
$ ./Taskfile test -w
```

---

_This project was set up by @jvdx/core_
