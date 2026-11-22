import pathlib,sys,zipfile
p=pathlib.Path(sys.argv[1])
for mb in (26,173,500,501):
    size=mb*1024*1024
    name="fixture.bin"
    remaining=size-(30+46+22+2*len(name))
    target=p/("fixture-"+str(mb)+".zip")
    with zipfile.ZipFile(target,"w",compression=zipfile.ZIP_STORED) as archive:
        with archive.open(name,"w") as out:
            while remaining:
                count=min(remaining,1024*1024);out.write(bytes(count));remaining-=count
    assert target.stat().st_size==size
    with zipfile.ZipFile(target) as archive: assert archive.testzip() is None
    target.chmod(0o600)
    print("VALID_ZIP_MIB",mb,flush=True)
