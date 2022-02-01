let app = angular.module('appJuego', []);

app.controller("controladorJuego", function ($scope, $http) {
    $scope.randomIDNumbersArr = []; //Arreglo de ID de digitos aleatorios
    $scope.numberQuantity = 5; // Cantidad de numeros con los que se jugara el juego
    $scope.numbersInfoArr = []; //Arreglo que contiene ID, valor y ruta de cada numero
    $scope.correctAnswersSortedArr = []; //Lugar donde siempre esttaran ordenados los datos
    $scope.mistakesCountArr = [];  //Cantidad de errores que ha tenido el jugador
    $scope.score = 0; //Puntaje de la ronda
    $scope.scoreArr = []; //Puntaje que ha llevado a lo largo de las rondas
    $scope.IsThatNumberInPlace; //Respondio correctamente? - bool
    $scope.timeToFinish = 8; // Tiempo en segundos que tiene para terminar la ronda
    $scope.timeSpent = 0; // Tiempo que le tomo la ronda
    $scope.counter = 0; //Contador en pantalla
    $scope.numberOfTries = 3; // Maximo de cuantos errores puedes tener
    $scope.ongoingRound = false; //Hay una ronda en curso? 
    $scope.divNumbersToPlayWith = []; //PARTE DE ARRIBA
    $scope.divSpacesToPlaceElements = [];//PARTE DE ABAJO
    $scope.recoveredNumberValue = 0; //Evento - Recupera el valor del numero
    $scope.recoveredNumberID = 0; //Evento - Recupera el ID del numero
    $scope.recoveredAnswerArrayIndex = 0; //Evento - Recupera el lugar dentro del array divSpacesToPlaceElements

    //$scope.prevAnswer;
    $scope.imageSelected = false;

    //Antes que nada, primero traer el json
    $scope.JsonDataRAWArr = [];
    $scope.importFromJson = function () {
        $http({
            method: 'GET',
            url: 'assets/json/datos.json'
        }).then(successCallback, errorCallback);
        function successCallback(response) {
            $scope.JsonDataRAWArr = response.data;
        }
        function errorCallback(error) {
            console.log("Error");
        }
    };

    $scope.startGame = function () {
        if ($scope.ongoingRound == false) {
            if ($scope.numbersInfoArr.length === 0) {
                $scope.mergingTwoArrays($scope.numbersInfoArr, $scope.JsonDataRAWArr.digitos); //Pone en otro array el json para no afectar al original
            }
            $scope.scrambleNumbers($scope.randomIDNumbersArr);   //Consigue un arreglo de 5 ID de imagenes
            $scope.selectSomeNumbers($scope.numbersInfoArr, $scope.randomIDNumbersArr); // Consigue imagenes con ese ID y las revuelve
            $scope.addLessThanSymbol($scope.divSpacesToPlaceElements);  //Prepara el arreglo donde se van a dibujar las respuestas 
            $scope.counter = $scope.timeToFinish;
            $scope.countdown(); //Inicia el contador
            $scope.ongoingRound = true;
        }
    };

    $scope.tryAnswer = function () {
        if ($scope.recoveredAnswerArrayIndex % 2 == 1 && $scope.ongoingRound == true && $scope.imageSelected == true) {
            $scope.evaluateAnswer($scope.divSpacesToPlaceElements, $scope.recoveredAnswerArrayIndex, $scope.recoveredNumberValue);
            if ($scope.IsThatNumberInPlace === true) {  //Validacion si la respuesta esta bien
                $scope.deleteElementInArray($scope.recoveredNumberID, $scope.divNumbersToPlayWith, $scope.correctAnswersSortedArr);
                $scope.sortElementsInArray($scope.correctAnswersSortedArr);
                $scope.divSpacesToPlaceElements.length = 0;
                $scope.mergingTwoArrays($scope.divSpacesToPlaceElements, $scope.correctAnswersSortedArr);
                $scope.addLessThanSymbol($scope.divSpacesToPlaceElements);
                $scope.imageSelected = false;
                if ($scope.correctAnswersSortedArr.length == $scope.numberQuantity) { //ya tiene los x aciertos maximos?
                    $scope.calculateScore();
                }
            } else if ($scope.IsThatNumberInPlace === false) { //Validacion si la respuesta esta mal
                $scope.mistakesCountArr.push({ "path": "X.png" });
                if ($scope.mistakesCountArr.length === $scope.numberOfTries) { //ya tiene los x errores maximos?
                    $scope.calculateScore();
                }
            }

        }
    };

    $scope.scrambleNumbers = function (randomNumersArr) {
        if (randomNumersArr.length === 0) {
            for (let i = 0; i < $scope.numberQuantity; i++) { //Cantidad de numeros que van a haber en el juego
                var newlyGeneratedNumber = Math.round(Math.random() * 10); //Cantidad de digitos que existen
                var isThisARepeatedNumber = randomNumersArr.includes(newlyGeneratedNumber);
                if (isThisARepeatedNumber === true || newlyGeneratedNumber === 0) {
                    i--;
                } else {
                    randomNumersArr.push(newlyGeneratedNumber);
                };
            };
        };
    };

    $scope.selectSomeNumbers = function (entirelyArray, filterCriteria) {
        $scope.divNumbersToPlayWith = entirelyArray.filter(element => filterCriteria.includes(parseInt(element.id)));
        $scope.shuffleElementsOfAnArray($scope.divNumbersToPlayWith);
    };

    $scope.shuffleElementsOfAnArray = function (shuffledArray) {
        for (i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    };

    /////////////////// Funciones para manejar arrays 
    $scope.mergingTwoArrays = function (applyArray1, applyArray2) {
        Array.prototype.push.apply(applyArray1, applyArray2);
        return [applyArray1, applyArray2];
    };

    $scope.addLessThanSymbol = function (toAddLessThan) {
        //Por cada dibujo de un numero que hay en el arreglo, agrega un dibujo del simbolo < de manera intercalada con relacion 1:1
        for (let i = 0, max = toAddLessThan.length * 2; i < max; i += 2) {
            toAddLessThan.splice(i, 0, { "id": "11", "path": "flecha.png" });
        }
        //Pero agrega uno al final del arreglo para que el simbolo < cubra ambos extremos del arreglo
        toAddLessThan.push({ "id": "11", "path": "flecha.png" });
        //Los siguientes elementos no tienen imagen, por lo que no se dibujan en pantalla pero existen para evaluar la respuesta mas alta posible
        toAddLessThan.push({ "value": "11" }); //Se inserta un elemento con la respuesta con el valor maximo + 1 al final del arreglo
        toAddLessThan.unshift({ "value": "-1" }); //Se inserta un elemento con la respuesta con el valor minimo -1 al inicio del arreglo
        return toAddLessThan;
    };

    $scope.insertElementInArray = function (arrayToBeInserted, elementToPush) {
        console.log("El elemento ", elementToPush, " se va insertar en ", arrayToBeInserted);
        arrayToBeInserted.push(elementToPush);
        return arrayToBeInserted;
    };

    $scope.sortElementsInArray = function (arrayToOrder) {
        arrayToOrder.sort(function (a, b) {
            return new Date(a.value) - new Date(b.value);
        });
    };

    $scope.deleteElementInArray = function (elementToDelete, hasAnElementToDeleteArr, correctAnswersArr) {
        for (let i = 0; i < hasAnElementToDeleteArr.length; i++) {
            if (hasAnElementToDeleteArr[i].id === elementToDelete) {
                numberToBeRemove = hasAnElementToDeleteArr.splice(i, 1)[0];
                console.log("Elemento que se agrega a las respuestas: ", numberToBeRemove.path);
                correctAnswersArr.push(numberToBeRemove);
            }
        }
    };

    /////////////////// Eventos con clicks


    let $btnMensaje = document.querySelector("#btnMensaje");

    $btnMensaje.addEventListener("click", () =>{
        console.log("No me presiones")
    })

    $scope.getANumberValue = function (clickValue) {
        $scope.recoveredNumberValue = parseInt(clickValue);
        console.log("Se ha seleccionado el numero con el valor ", $scope.recoveredNumberValue);
        $scope.imageSelected = true;
    };

    $scope.getANumberID = function (clickID) {
        $scope.recoveredNumberID = clickID;
    };

    $scope.getAnswerIndex = function (index) {
        $scope.recoveredAnswerArrayIndex = parseInt(index);
    };

    /////////////////// Funciones para evaluar 
    $scope.evaluateAnswer = function (originOfTheElement, index, finalAnswer) {
        let min = (parseInt(originOfTheElement[index - 1].value));
        let max = (parseInt(originOfTheElement[index + 1].value));
        let number = (parseInt(finalAnswer));
        //if($scope.prevAnswer != $scope.recoveredAnswerArrayIndex){
        if (min < number && number < max) {
            $scope.IsThatNumberInPlace = true;
        } else {
            $scope.IsThatNumberInPlace = false;
        }
        /* $scope.prevAnswer = parseInt($scope.recoveredAnswerArrayIndex); */
        console.log(min, ">", finalAnswer, ">", max, ". Es la respuesta correcta?", $scope.IsThatNumberInPlace);
        return $scope.IsThatNumberInPlace;
        //}
    };

    /////////////////// Cronometro

    $scope.countdown = function () {
        setTimeout(function () {
            $scope.$apply(function () {
                if ($scope.counter > 0 && $scope.ongoingRound == true) {
                    $scope.counter--;
                    $scope.timeSpent++;
                    $scope.countdown();
                } else if ($scope.counter === 0 && $scope.ongoingRound == true) {
                    $scope.calculateScore(); // aqui debo evitar que lo vuelva a evaluar, chance un if fuera del sitio
                }
            });
        }, 1000);
    };

    /////////////////// Calcular puntaje

    $scope.calculateScore = function () {
        if ($scope.correctAnswersSortedArr.length === $scope.numberQuantity) { //Si termino correctamente las preguntas
            $scope.score = (($scope.correctAnswersSortedArr.length * 20) + (Math.round((($scope.counter) / ($scope.timeToFinish)) * 10)) + Math.round((($scope.numberOfTries - $scope.mistakesCountArr.length / $scope.numberOfTries) * 10)));
        } else if ($scope.correctAnswersSortedArr.length === 0) {  //No respondio nada bien
            $scope.score = 0;
        } else { //Si no termino por tiempo-erroes pero contesto corerectamente algunas preguntas
            $scope.score = (($scope.correctAnswersSortedArr.length * 20) + Math.round((($scope.numberOfTries - $scope.mistakesCountArr.length / $scope.numberOfTries) * 10)));
        }
        //id++;
        $scope.scoreArr.unshift({ "Aciertos": $scope.correctAnswersSortedArr.length, "Tiempo": $scope.timeSpent, "Errores": $scope.mistakesCountArr.length, "Puntaje": $scope.score });
        $scope.ongoingRound = false;
    };



    $scope.prepareNextRound = function () { //Limpia todo
        $scope.recoveredAnswerArrayIndex = 0;
        $scope.recoveredNumberValue = 0;
        $scope.recoveredNumberID = 0;
        $scope.divSpacesToPlaceElements.length = 0;
        $scope.divNumbersToPlayWith.length = 0;
        $scope.correctAnswersSortedArr.length = 0;
        $scope.randomIDNumbersArr.length = 0;
        $scope.timeSpent = 0;
        $scope.mistakesCountArr.length = 0;
        $scope.imageSelected = false;
        $scope.startGame();
    }

    //Start
    $scope.importFromJson();
}
);