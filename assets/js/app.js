let recuperar_datos = angular.module('datos_app', []);

recuperar_datos.controller('controlador_datos', function ($scope, $http, $timeout) {
    $scope.randomNumbersIDArr = []; //Se usa en $scope.scrambleNumbers 
    $scope.numbersInfoArr = []; //Se usa en $scope.mergingTwoArrays
    $scope.divNumbersToPlayWith = []; //PARTE DE ARRIBA
    $scope.divSpacesToPlaceElements = [];//PARTE DE ABAJO
    $scope.correctAnswersSortedArr = []; //Lugar donde siempre esttaran ordenados los datos
    $scope.mistakesCountArr = [];  //Parte del juego
    $scope.puntaje = 0;
    $scope.puntajeArray = [];
    $scope.IsThatNumberInPlace; //Esta en el lugar correcot? - bool
    $scope.numberOfTries = 30;
    $scope.recoveredNumberValue = 0; //Se recupera de la imagen el valor del numero
    $scope.recoveredNumberID = 0;
    $scope.recoveredAnswerArrayIndex = 0;

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
            $scope.JsonDataRAWArr = "Error";
        }
    };
    $scope.importFromJson();

    $scope.startGame = function () {
        $scope.mergingTwoArrays($scope.numbersInfoArr, $scope.JsonDataRAWArr.albumes); //Pone en otro array el json para no afectar al original
        $scope.scrambleNumbers($scope.randomNumbersIDArr);   //Consigue un arreglo de 5 ID de imagenes
        $scope.selectSomeNumbers($scope.numbersInfoArr, $scope.randomNumbersIDArr); // Consigue imagenes con ese ID y las revuelve
        $scope.addLessThanSymbol($scope.divSpacesToPlaceElements);  //Prepara el arreglo donde se van a dibujar las respuestas 
        //$scope.countdown(); //Inicia el contador
    };

    $scope.tryAnswer = function () {
        if ($scope.recoveredAnswerArrayIndex % 2 == 1) {
            if ($scope.mistakesCountArr.length < $scope.numberOfTries) {
                $scope.evaluateAnswer($scope.divSpacesToPlaceElements, $scope.recoveredAnswerArrayIndex, $scope.recoveredNumberValue);
                if ($scope.IsThatNumberInPlace === true) {
                    $scope.deleteElementInArray($scope.recoveredNumberID, $scope.divNumbersToPlayWith, $scope.correctAnswersSortedArr);
                    $scope.orderElementsInArray($scope.correctAnswersSortedArr);
                    $scope.divSpacesToPlaceElements.length = 0;
                    $scope.mergingTwoArrays($scope.divSpacesToPlaceElements, $scope.correctAnswersSortedArr);
                    $scope.addLessThanSymbol($scope.divSpacesToPlaceElements);
                } else if ($scope.IsThatNumberInPlace === false) {
                    $scope.mistakesCountArr.push({ "path": "X.png" });
                } else {
                    console.log("Algo raro paso");
                }
            } else {
                console.log("Intento");
            }
        }
    };

    $scope.scrambleNumbers = function (randomNumersArr) {
        if (randomNumersArr.length === 0) {
            for (let i = 0; i < 5; i++) { //Cantidad de numeros que van a haber en el juego
                var newlyGeneratedNumber = Math.round(Math.random() * 10); //Cantidad de numeros que existen
                var isThisARepeatedNumber = randomNumersArr.includes(newlyGeneratedNumber);
                if (isThisARepeatedNumber === true || newlyGeneratedNumber === 0) {
                    i = i - 1;
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

    $scope.orderElementsInArray = function (arrayToOrder) {
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

    $scope.getANumberValue = function (clickValue) {
        $scope.recoveredNumberValue = clickValue;
        console.log("Se ha seleccionado el numero con el valor ", $scope.recoveredNumberValue);
    };

    $scope.getANumberID = function (clickID) {
        $scope.recoveredNumberID = clickID;
    };

    $scope.getAnswerIndex = function (index) {
        $scope.recoveredAnswerArrayIndex = index;
    };

    /////////////////// Funciones para evaluar 
    $scope.evaluateAnswer = function (originOfTheElement, index, finalAnswer) {
        let min = (parseInt(originOfTheElement[index - 1].value));
        let max = (parseInt(originOfTheElement[index + 1].value));
        let number = (parseInt(finalAnswer));
        if (min < number && number < max) {
            $scope.IsThatNumberInPlace = true;
        } else {
            $scope.IsThatNumberInPlace = false;
        }
        console.log(min, ">", finalAnswer, ">", max, ". Es la respuesta correcta?", $scope.IsThatNumberInPlace);
        return $scope.IsThatNumberInPlace;
    };

    /////////////////// Funciones ronda

    $scope.counter = 0;

    $scope.countdown = function () {
        let setInter = 0;
        let start = 10
        let end = 0;
        $scope.counter = start;
        setInter = setInterval(function () {
            if ($scope.counter > 0) {
                console.log($scope.counter);
            } else {
                console.log('Fin del juego');
                clearInterval(setInter);
                //$scope.calcular();
            }
            $scope.counter = $scope.counter - 1;
        }, 1000);
    };
    /* 
        $scope.counter = 10;
    
    
        $scope.countdown = function () {
            let stopped = $timeout(function () {
                console.log($scope.counter);
                $scope.counter--;
                $scope.countdown();
            }, 1000);
        };
    
        $scope.stop = function(){
            $timeout.cancel(stopped);
        } */





    $scope.calcular = function () {
        alert("Se ha terminado la ronda");
        $scope.congelar = true;
        if ($scope.correctAnswersSortedArr.length === 5) {
            $scope.puntaje = (($scope.correctAnswersSortedArr.length * 10));
            alert("Ganaste");
            console.log($scope.puntaje);

            $scope.puntajeArray.push($scope.puntaje);
            $scope.prepareNextRound();
        } else {
            alert("Perdiste");
            $scope.puntajeArray.push($scope.puntaje);
            //alert("Tu puntaje de esta ronda fue de", $scope.puntaje);
            $scope.prepareNextRound();
        }
    };

    $scope.prepareNextRound = function () {

        $scope.recoveredAnswerArrayIndex = 0;
        $scope.recoveredNumberValue = 0;
        $scope.recoveredNumberID = 0;
        $scope.divSpacesToPlaceElements.length = 0;
        $scope.correctAnswersSortedArr.length = 0;
        $scope.divNumbersToPlayWith.length = 0;
        $scope.randomNumbersIDArr.length = 0;

    }
}
);