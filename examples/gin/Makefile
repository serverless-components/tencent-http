all: build deploy

build:
	GOOS=linux GOARCH=amd64 go build -o main main.go
deploy:
	sls deploy
info:
	sls info
remove:
	sls remove
