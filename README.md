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
time node cagda.js Everything.agda 6
```

we get :

```
real    9m57.539s
user    34m30.467s
sys     0m58.157s
```

