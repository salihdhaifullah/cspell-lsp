#!/bin/bash
cp package.publish.json package.json

npm publish --access public

git checkout package.json
