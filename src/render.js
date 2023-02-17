// make a reference in the DOM
const vidioElement = document.getElementById('vidio');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const vidioSelectBtn = document.getElementById('vidioSelectBtn');

vidioSelectBtn.onclick=getVidioSources;

// import the nodejs module in the browser
const remote = require('@electron/remote');
const {desktopCapturer,Menu, dialog } = remote;

async function getVidioSources(){
    const inputSources = await desktopCapturer.getSources({
        types:['window','screen']
    });

    const vidioOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source=>{
            return {
                label:source.name,
                click:()=>selectSource(source)
            }
        })
    )

    vidioOptionsMenu.popup()
}

// MediaRecorder instance to capture footage
let mediaRecorder;
const recordedChunk = [];

async function selectSource(source){
    vidioSelectBtn.innerText = source.name;
    const constraints = {
        audio:false,
        video:{
            mandatory:{
                chromeMediaSource:'desktop',
                chromeMediaSourceId:source.id
            }
        }
    }
    // create a stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    //preview the source in a video element
    vidioElement.srcObject = stream;
    vidioElement.play();


    // create the media recorder
    const options = { mimeType:'video/webm;codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream,options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onStop = handleStop;

}

function handleDataAvailable(e){
    recordedChunk.push(e.data)
}

const { writeFile} =require('fs')
async function handleStop(e){
    // convert in to vidio file
    const blob = Blob(recordedChunk,{
        type:'video/webm;codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    // electrons dialogue box for save
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel : 'Save Video',
        defaultPath : `vid-${Date.now()}.webm` 
    });

    writeFile(filePath,buffer,()=>console.log("Video Saved Successfully!"));
}

