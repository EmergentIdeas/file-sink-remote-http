import {test, assert} from "@webhandle/test-assert"
import props from './test-properties.mjs'
import addBasicCases from "../test-lib/basic-test-cases.mjs"
import {FileSinkRemoteHttp} from "file-sink-remote-http"
addBasicCases(props, FileSinkRemoteHttp, test, assert)
