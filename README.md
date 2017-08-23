# agda-mt

This program creates a graph of agda files based on their imports and concurrently typecheckes them by spawning multiple agda instances.

It is not efficient, it is just a hack but there is some speed increase.

Typechecking HoTT-Agda (everything in the theorem folder) with a single agda process results in :


```
real    14m20.085s
user    14m15.585s
sys     0m3.967s
```

When checking it with agda-mt :

```
time node cagda.js Everything.agda 4
```

we get :

```
real    7m5.636s
user    18m29.676s
sys     0m15.526s
```


