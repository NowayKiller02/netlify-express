var db;
var VersionID = 1;

function AskPer() {
    if (!("Notification" in window))
        console.log("notifications worden niet ondersteund");
    else {
        // Bekijk of er vroeger reeds toestemming werd gegeven
        if (Notification.permission == "granted") {
            //Er is reeds toestemming
            console.log("Toestemming werd reeds eerder gegeven");
            $('#btnnoti').hide();
        } else {
            if (Notification.permission !== "denied") {
                // Eerder werd er nog niet geweigerd, vraag nu toestemming
                // https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission
                Notification.requestPermission().then(permission => {
                    if (permission == "granted") {
                        //Er werd toestemming gegeven
                        console.log("Toestemming werd zonet gegeven");
                        $('#btnnoti').hide();
                    }
                });
            }
            else {
                console.log("toestemming werd geweigerd");

            }
        }
    }
}



// Zie: https://github.com/GoogleChromeLabs/web-push-codelab/blob/master/app/scripts/main.js
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}


// Maken van arrays om de naam te linken aan de prijs en de foto.

var laptop = [
    "DELL XPS 13",
    'Microsoft Surface 4 15"',
    "HP ZBook Create G7",
    "HP Gaming 15",
    "Realme Book 14",
    "Gigabyte AORUS 15",
    "HP Pavilion 15",
    'MacBook Pro 16',
    "Huawei MateBook 14",
    "Lenovo IdeaPad Slim 3",
    "ASUS ROG Strix G15",
    "XPG XENIA 15"
]

var pics = [
    "./images/L1.jpg",
    "./images/L2.jpg",
    "./images/L3.jpg",
    "./images/L4.jpg",
    "./images/L5.jpg",
    "./images/L6.jpg",
    "./images/L7.jpg",
    "./images/L8.jpg",
    "./images/L9.jpg",
    "./images/L10.jpg",
    "./images/L11.jpg",
    "./images/L12.jpg",
]


var prizes = [
    "1399.99",
    "1499.99",
    "1699.99",
    "1199.99",
    "1099.99",
    "1699.99",
    "799.99",
    "2799.99",
    "1199.99",
    "599.99",
    "1099.99",
    "1199.99",
]

var ids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

var items = ids.map((index) => {
    return {
        ID: ids[index],
        name: laptop[index],
        cost: prizes[index],
        pic: pics[index]
    }
});







document.addEventListener('DOMContentLoaded', function () {

    // Verberg de knop als je al toestemming gegeven hebt.
    if (Notification.permission == "granted") {
        //Er is reeds toestemming
        console.log("Toestemming werd reeds eerder gegeven");
        $('#btnnoti').hide();
    }


    ////////////////// init INDEXEDDB ///////////////////////////////

    if (!window.indexedDB)
        console.log("IndexedDB not supported.");
    else {
        var request = indexedDB.open("YLOPC", VersionID);
        request.onupgradeneeded = function (event) {

            db = event.target.result;
            // Create an objectStore for this database
            var objectStore = db.createObjectStore("items", { keyPath: "ID", autoIncrement: true });
            objectStore.createIndex("ID", "ID", { unique: true });
            objectStore.createIndex("itemName", "itemName");
        }

    }
    ///////////////////////////////////////////////////////////////// 


    // Zoek alle elementen die als CSS-klasse '.side-menu' hebben.
    var elems = document.querySelectorAll('.side-menu');
    // Maak een JavaScript object met opties daarin.
    var options = { edge: "right" };
    // Materialize CSS sidenav initialiseren.
    M.Sidenav.init(elems, options);


    // functie dat de beschikbare laptops toont
    function showItems(bool) {
        for (let i = 1; i < 13; i++) {
            const laptops = document.querySelector(`.div${i}`);
            laptops.innerHTML = "";

            if (bool) {
                sortByName();
            }
            else {
                sortByPrice();
            }
            const hmtl = `
            <div class="card">
            <img src="${items[i - 1].pic}" alt="${items[i - 1].name}" style="width:100%">
            <h5>${items[i - 1].name}</h5>
            <p class="price">€ ${items[i - 1].cost}</p>
            <p><button onclick="addToCart(${items[i - 1].ID}, '${items[i - 1].name} for ${items[i - 1].cost}')" id="btn${items[i - 1].ID}">Add</button></p>
            </div>
            `;

            // HTML toevoegen.
            laptops.innerHTML += hmtl;

        }
    }
    showItems(true);


    //sorteren van de beschikbare laptops..
    function sortByPrice() {
        items.sort(function (a, b) { return a.cost - b.cost });
    }
    function sortByName() {
        items.sort(function (a, b) {
            let x = a.name.toLowerCase();
            let y = b.name.toLowerCase();
            if (x < y) { return -1; }
            if (x > y) { return 1; }
            return 0;
        });
    }



    //kijkt hoe sorteren
    $("#sorts").on("change", function () {
        var sortBy = event.target.value;
        $('#sorts').blur();
        if (sortBy == 'price') {
            showItems(false);
        }
        else if (sortBy == 'name') {
            showItems(true);
        }
    });
});

function addToCart(id, text) {
    var itemdata = { itemName: id };
    AddItems(itemdata);
    var msg = new SpeechSynthesisUtterance();
    msg.text = "You have added " + text + "to the cart!";
    window.speechSynthesis.speak(msg);

    swal("Succes!", "Item is toegevoegd aan de winkelwagen", "success");
}


function AddItems(arraytoAdd) {
    var request = window.indexedDB.open("YLOPC", VersionID);
    request.onsuccess = function (event) {
        var db = event.target.result;
        Items = [];
        Items.push(arraytoAdd);
        var matchObjectStore = db.transaction("items", "readwrite").objectStore("items");
        Items.forEach(function (match) {
            var request = matchObjectStore.add(match);
            request.onsuccess = function () {
                console.log("Item added to List...");
            };
        });
    };
}

