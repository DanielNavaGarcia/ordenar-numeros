let app = angular.module('appJuego', []);

app.controller("controladorJuego", function ($scope, $http) {
    let randomIDNumbersArr = []; //Arreglo de ID de digitos aleatorios
    let numberQuantity = 5; // Cantidad de numeros con los que se jugara el juego
    let numbersInfoArr = []; //Arreglo que contiene ID, valor y ruta de cada numero
    let correctAnswersSortedArr = []; //Lugar donde siempre esttaran ordenados los datos
    let score = 0; //Puntaje de la ronda
    let IsThatNumberInPlace; //Respondio correctamente? - bool
    let timeToFinish = 8; // Tiempo en segundos que tiene para terminar la ronda
    let timeSpent = 0; // Tiempo que le tomo la ronda
    let numberOfTries = 3; // Maximo de cuantos errores puedes tener
    let isOngoingRound = false; //Hay una ronda en curso? 
    let recoveredNumberValue = 0; //Evento - Recupera el valor del numero
    let recoveredNumberID = 0; //Evento - Recupera el ID del numero
    let recoveredAnswerArrayIndex = 0; //Evento - Recupera el lugar dentro del array divSpacesToPlaceElements
    let isImageSelected = false; //Se ha seleccionado la imagen de un digito?

    $scope.counter = 0; /* Contador en pantalla */
    $scope.divNumbersToPlayWith = []; /* PARTE DE ARRIBA */
    $scope.divSpacesToPlaceElements = []; /* PARTE DE ABAJO */
    $scope.scoreArr = []; /* Puntaje que ha llevado a lo largo de las rondas */
    $scope.mistakesCountArr = [];  /* Cantidad de errores que ha tenido el jugador */

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
        if (isOngoingRound == false) {
            if (numbersInfoArr.length === 0) {
                $scope.mergingTwoArrays(numbersInfoArr, $scope.JsonDataRAWArr.digitos); //Pone en otro array el json para no afectar al original
            }
            scrambleNumbers(randomIDNumbersArr);   //Consigue un arreglo de 5 ID de imagenes
            $scope.selectSomeNumbers(numbersInfoArr, randomIDNumbersArr); // Consigue imagenes con ese ID y las revuelve
            $scope.addLessThanSymbol($scope.divSpacesToPlaceElements);  //Prepara el arreglo donde se van a dibujar las respuestas 
            $scope.counter = timeToFinish;
            $scope.countdown(); //Inicia el contador
            isOngoingRound = true;
        }
    };

    $scope.tryAnswer = function () {
        if (recoveredAnswerArrayIndex % 2 == 1 && isOngoingRound == true && $scope.isImageSelected == true) {
            $scope.evaluateAnswer($scope.divSpacesToPlaceElements, recoveredAnswerArrayIndex, recoveredNumberValue);
            if (IsThatNumberInPlace === true) {  //Validacion si la respuesta esta bien
                $scope.deleteElementInArray(recoveredNumberID, $scope.divNumbersToPlayWith, correctAnswersSortedArr);
                $scope.sortElementsInArray(correctAnswersSortedArr);
                $scope.divSpacesToPlaceElements.length = 0;
                $scope.mergingTwoArrays($scope.divSpacesToPlaceElements, correctAnswersSortedArr);
                $scope.addLessThanSymbol($scope.divSpacesToPlaceElements);
                $scope.isImageSelected = false;
                if (correctAnswersSortedArr.length == numberQuantity) { //ya tiene los x aciertos maximos?
                    $scope.calculateScore();
                }
            } else if (IsThatNumberInPlace === false) { //Validacion si la respuesta esta mal
                $scope.mistakesCountArr.push({ "path": "X.png" });
                if ($scope.mistakesCountArr.length === numberOfTries) { //ya tiene los x errores maximos?
                    $scope.calculateScore();
                }
            }
        }
    };

    let scrambleNumbers = function (randomNumersArr) {
        if (randomNumersArr.length === 0) {
            let i = 0;
            while (i < numberQuantity) {
                let newlyGeneratedNumber = Math.round(Math.random() * 10); //Cantidad de ID que existen
                let isThisARepeatedNumber = randomNumersArr.includes(newlyGeneratedNumber);
                //console.log("Este numero: ", "(", newlyGeneratedNumber, ") esta dentro del arreglo", randomNumersArr, " R: ", isThisARepeatedNumber);
                if (isThisARepeatedNumber !== true && newlyGeneratedNumber != 0) {
                    randomNumersArr.push(newlyGeneratedNumber);
                    //console.log("push", randomNumersArr);
                    i++
                }
            }
        }
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
            return a.value - b.value;
        });
    };

    $scope.deleteElementInArray = function (elementToDelete, hasAnElementToDeleteArr, correctAnswersArr) {
        for (let i = 0; i < hasAnElementToDeleteArr.length; i++) {
            if (hasAnElementToDeleteArr[i].id === elementToDelete) {
                numberToBeRemove = hasAnElementToDeleteArr.splice(i, 1)[0];
                console.log("Elemento que se agrega a las respuestas: ", numberToBeRemove.path);
                correctAnswersArr.push(numberToBeRemove);

                break;
            }

        }
    };

    /////////////////// Eventos con clicks

    $scope.getANumberValue = function (clickValue) {
        recoveredNumberValue = parseInt(clickValue);
        console.log("Se ha seleccionado el numero con el valor ", recoveredNumberValue);
        $scope.isImageSelected = true;
    };

    $scope.getANumberID = function (clickID) {
        recoveredNumberID = clickID;
    };

    $scope.getAnswerIndex = function (index) {
        recoveredAnswerArrayIndex = parseInt(index);
    };

    /////////////////// Funciones para evaluar 
    $scope.evaluateAnswer = function (originOfTheElement, index, finalAnswer) {
        let min = (parseInt(originOfTheElement[index - 1].value));
        let max = (parseInt(originOfTheElement[index + 1].value));
        let number = (parseInt(finalAnswer));
        if (min < number && number < max) {
            IsThatNumberInPlace = true;
        } else {
            IsThatNumberInPlace = false;
        }
        console.log(min, ">", finalAnswer, ">", max, ". Es la respuesta correcta?", IsThatNumberInPlace);
        return IsThatNumberInPlace;
    };

    /////////////////// Cronometro

    $scope.countdown = function () {
        setTimeout(function () {
            $scope.$apply(function () {
                if ($scope.counter > 0 && isOngoingRound == true) {
                    $scope.counter--;
                    timeSpent++;
                    $scope.countdown();
                } else if ($scope.counter === 0 && isOngoingRound == true) {
                    $scope.calculateScore(); // aqui debo evitar que lo vuelva a evaluar, chance un if fuera del sitio
                }
            });
        }, 1000);
    };

    /////////////////// Calcular puntaje

    $scope.calculateScore = function () {
        if (correctAnswersSortedArr.length === numberQuantity) { //Si termino correctamente las preguntas
            score = ((correctAnswersSortedArr.length * 20) + (Math.round((($scope.counter) / (timeToFinish)) * 10)) + Math.round(((numberOfTries - $scope.mistakesCountArr.length / numberOfTries) * 10)));
        } else if (correctAnswersSortedArr.length === 0) {  //No respondio nada bien
            score = 0;
        } else { //Si no termino por tiempo-erroes pero contesto corerectamente algunas preguntas
            score = ((correctAnswersSortedArr.length * 20) + Math.round(((numberOfTries - $scope.mistakesCountArr.length / numberOfTries) * 10)));
        }
        //id++;
        $scope.scoreArr.unshift({ "Aciertos": correctAnswersSortedArr.length, "Tiempo": timeSpent, "Errores": $scope.mistakesCountArr.length, "Puntaje": score });
        isOngoingRound = false;
    };

    $scope.prepareNextRound = function () { //Limpia todo
        recoveredAnswerArrayIndex = 0;
        recoveredNumberValue = 0;
        recoveredNumberID = 0;
        $scope.divSpacesToPlaceElements.length = 0;
        $scope.divNumbersToPlayWith.length = 0;
        correctAnswersSortedArr.length = 0;
        randomIDNumbersArr.length = 0;
        timeSpent = 0;
        $scope.mistakesCountArr.length = 0;
        $scope.isImageSelected = false;
        $scope.startGame();
    };

    //Start
    $scope.importFromJson();
}
);