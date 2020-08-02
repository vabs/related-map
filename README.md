# VS Finder

## Google Integration

On searching with this url https://www.google.com/complete/search?client=hp&hl=en&q=???&xhr=t&callback=myAmazingFunction

### Parameters to be set:

* hl = Locale of the browser
* q = query string
* callback = Function to callback once the results are returned

### For example:

Search:

```
https://www.google.com/complete/search?client=hp&hl=en&sugexp=msedr&gs_rn=62&gs_ri=hp&cp=1&gs_id=9c&q=appl&xhr=t
```

Output:

```
[
  "appl",
  [
    [
      "appl<b>e</b>",
      0,
      [
        433
      ]
    ],
    [
      "appl<b>e canada</b>",
      0,
      [
        433
      ]
    ],
    [
      "appl<b>e store</b>",
      0,
      [
        433
      ]
    ],
    [
      "appl<b>e stock</b>",
      0,
      [
        433,
        131
      ]
    ],
    [
      "appl<b>e store montreal</b>",
      0
    ],
    [
      "appl<b>e watch</b>",
      0,
      [
        433
      ]
    ],
    [
      "appl<b>e tv</b>",
      0,
      [
        433
      ]
    ],
    [
      "appl<b>y for cerb</b>",
      0,
      [
        433
      ]
    ],
    [
      "appl<b>e support</b>",
      0,
      [
        433
      ]
    ],
    [
      "appl<b>e id</b>",
      0,
      [
        433
      ]
    ]
  ],
  {
    "j": "9c",
    "q": "DHj1CSuHdVtJziSuFoeFCA4K6DU"
  }
]
```

