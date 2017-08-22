# agda-mt

This program creates a graph of agda files based on their imports and concurrently typecheckes them by spawning multiple agda instances.

It is not efficient, it is just a hack but there is some speed increase.

Typechecking HoTT-Agda (everything in the theorem folder) with a single agda process results in :


```
real    16m55.396s
user    16m50.549s
sys     0m4.024s
```

When checking it with agda-mt :

```
time node cagda.js Everything.agda 10
```

we get :

```
real    10m12.217s
user    47m7.601s
sys     1m21.893s
```

