const tiles = [];
const scores = [];
let recording = false;
const recognition = new window.webkitSpeechRecognition();
recognition.lang = "en";
recognition.continuous = true;
recognition.maxAlternatives = 5;
let makeMoveButton = null;

console.log(recognition);

const getPositionAcordingToRecord = ()=>{

}

recognition.onaudiostart = () => {
    console.log("onaudiostart");
};

recognition.onaudioend = () => {
    console.log("onaudioend");
};

recognition.onerror = () => {
    console.log("onerror");
};

recognition.onend = () => {
    console.log("onend");
};

recognition.onsoundstart = () => {
    console.log("onsoundstart");
};

recognition.onsoundend = () => {
    console.log("onsoundend");
};

recognition.onspeechstart = () => {
    console.log("onspeechstart");
};

recognition.onspeechend = () => {
    console.log("onspeechend");
};

recognition.onresult = (record) => {
    const alternatives = record.results[0]
    console.log('record.results',alternatives);
    console.log('trancriptions',Object.values(alternatives).map(record=>record.transcript));
    console.log("onresult");
};


createFieldAndTiles = (totalTiles = 9) => {
    const container = document.createElement("div");
    container.classList.add("field");
    [...new Array(totalTiles)].map((_, i) => {
        const tile = document.createElement("div");
        tile.classList.add("field-tile");
        tiles.push(tile);
        container.appendChild(tile);
    });
    return container;
};

window.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".body").append(createFieldAndTiles());
    makeMoveButton = document.querySelector('#make-move')
    makeMoveButton.addEventListener('click',({target})=>{
        if(recording){
            recognition.stop()
            recording = false
        }
        else{
            recognition.start()
            recording = true
        }
    })
});
