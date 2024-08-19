# Address search API

## How to get started

First of all you need to install all the dependencies

```bash
npm i
```

Then you need to generate api key

```bash
npm run key:generate
```

But you also may use pre-generated test key - `a0f01a7f990f8d472873e321f4579cc1`

After that let's start the app

```bash
npm start
```

Now you have an api running on `localhost:3000` with the following endpoint

```
/api/{country}?q={searchQuery}&api_key={api_key}
```

## Usage example

### Request
```bash
curl 'http://localhost:3000/api/gb?q=Prime%20Minister&api_key=***'
```

### Response

```json
{
  "matches": [
    {
      "id": "paf_23747771",
      "name": "Prime Minister & First Lord Of The Treasury, 10 Downing Street, London, SW1A",
      "line1": "Prime Minister & First Lord Of The Treasury",
      "line2": "10 Downing Street",
      "line3": "",
      "city": "London",
      "zip": "SW1A 2AA",
      "state": "London",
      "country": "GB"
    }
  ],
  "items": {
    "total": 1
  }
}
```

### API

`country` - `gb` or `us`

`q` - any string

`api_key` - authorization api key

