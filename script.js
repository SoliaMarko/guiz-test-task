"use strict";

const pieDiagram = document.getElementById("pie-diagram");

// ---APP---
const appContainer = document.querySelector(".app-container");
const allPageContainers = document.querySelectorAll(".page-container");
const spinnerContainer = document.querySelector(".spinner-container");
// buttons
const closeBtns = [...document.querySelectorAll(".close-btn")];

// ---NAV---
const navContainer = document.querySelector(".nav-container");
const homeNavBtn = document.querySelector(".to-home");
const statsNavBtn = document.querySelector(".to-stats");
const allNavBtns = [...document.querySelectorAll(".nav-item")];

// ---HOME page---
const homeContainer = document.querySelector(".home-container");
const quizListContainer = document.querySelector(".quiz-list-container");
// buttons
const luckyBtn = document.querySelector(".lucky-btn");

// ---PLAY page---
const playContainer = document.querySelector(".play-container");
const questionContainer = document.querySelector(".play");
const slidesContainer = document.querySelector(".slides-container");
const slides = document.querySelectorAll(".current-quiz-wrapper");
// buttons
const btnLeft = document.querySelector(".btn-left");
const btnRight = document.querySelector(".btn-right");
const btnFinish = document.querySelector(".btn-finish");
const sliderBtns = [btnLeft, btnRight, btnFinish];
const timerLabel = document.querySelector(".timer");

// ---FINISH page---
const finishContainer = document.querySelector(".finish-container");
const resultsContainer = document.querySelector(".results-container");

// ---STATS page---
const statsContainer = document.querySelector(".stats-container");
const statsInfoContainer = document.querySelector(".stats-info");

// ---FOOTER---
const footerContainer = document.querySelector(".footer-container");

class App {
  #fetchedAmount = 0;
  #currentQuizIndex = 0;
  #allQuizzes = [];
  #quizInProgress = false;
  #pointsObj = {
    easy: 1,
    medium: 3,
    hard: 5,
  };

  #gameData = {
    answers: {
      chosen: [],
      correct: [],
      maxPoints: [],
    },
    general: {
      maxPoints: 0,
      questions: 0,
    },
    results: {
      points: 0,
      correctAnswers: 0,
      score: 0,
      timeFormatted: "",
      timeSec: 0,
    },
    questionsByDifficulty: {
      easy: {
        total: 0,
        correct: 0,
      },
      medium: {
        total: 0,
        correct: 0,
      },
      hard: {
        total: 0,
        correct: 0,
      },
    },
  };

  #stats = {
    quizzesPlayed: 0,
    questionsAnswered: 0,
    avgAnswTime: 0,
    totalSec: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  };

  constructor(quizzes) {
    this.quizzesAmount = quizzes;
    this._hide(appContainer);
    this._show(spinnerContainer);

    this._generateQuizzes(this.quizzesAmount);
    this._checkIfFetched();

    this._getLocalStorage();
    this._renderStats();
    this._renderChart();

    allNavBtns.forEach((item) =>
      item.addEventListener(
        "click",
        this._goTo.bind(this, item.innerHTML.toLowerCase())
      )
    );

    closeBtns.forEach((btn) =>
      btn.addEventListener("click", this._goTo.bind(this, "home"))
    );

    quizListContainer.addEventListener("click", this._selectQuiz.bind(this));
    luckyBtn.addEventListener("click", this._selectRandomQuiz.bind(this));
    questionContainer.addEventListener("click", this._chooseAnswer.bind(this));
    sliderBtns.forEach((btn) =>
      btn.addEventListener("click", this._switchQuestion.bind(this))
    );
  }

  // --- APP ---
  _getQuizData(questionsAmount, categoryIndex) {
    return fetch(
      `https://opentdb.com/api.php?amount=${questionsAmount}&category=${categoryIndex}`
    )
      .then((res) => {
        if (!res.ok)
          throw new Error("Can't get data for a quiz. Please try again later");
        return res.json();
      })
      .then((data) => {
        this.#allQuizzes.push(data.results);
        this.#fetchedAmount++;
      })
      .catch((err) => {
        alert(err);
      });
  }

  _checkIfFetched() {
    const check = function() {
      if (this.#fetchedAmount === this.quizzesAmount) {
        this._startAppExecution();
        clearInterval(checker);
      }
    };

    check.call(this);
    const checker = setInterval(() => {
      check.call(this);
    }, 1000);

    return checker;
  }

  _startAppExecution() {
    this._hide(spinnerContainer);
    this._show(appContainer);
    this._goTo("home");
    this._renderAllQuizzes();
  }

  // ---NAV---
  _goTo(pageName) {
    this._hideAllPages();

    const requestedPageContainer = document.querySelector(
      `.${pageName}-container`
    );
    this._show(requestedPageContainer);

    if (pageName === "home") {
      this._showNavForHome();
      this.#quizInProgress = false;
    }

    if (pageName === "play") {
      this._showNavForPlay();
    }

    if (pageName === "stats") {
      this._renderStats();
      this._hide(footerContainer);
    }

    for (let navItem of allNavBtns) {
      navItem.classList.remove("current-page");
    }

    if (pageName === "home" || pageName === "stats") {
      const curPageNavBtn = document.querySelector(`.to-${pageName}`);
      curPageNavBtn.classList.add("current-page");
    }
  }

  _showNavForHome() {
    homeNavBtn.classList.add("current-page");
    statsNavBtn.classList.remove("current-page");
    this._show(statsNavBtn);
    this._show(footerContainer);
  }

  _showNavForPlay() {
    homeNavBtn.classList.remove("current-page");
    this._hide(statsNavBtn);
    this._hide(footerContainer);
  }

  _hideAllPages() {
    allPageContainers.forEach((pageCont) => {
      this._hide(pageCont);
    });
  }

  // ---HOME---
  _generateQuizzes(amount) {
    for (let i = 0; i < amount; i++) {
      const questionsAmount = this._getRandomBetween(5, 15);

      // 9 and 32 - indexes for categories in API
      const categoryIndex = this._getRandomBetween(9, 32);

      this._getQuizData(questionsAmount, categoryIndex);
    }
  }

  _startQuiz(index, data) {
    this.#quizInProgress = true;
    this.#currentQuizIndex = index;
    this._renderQuestions(data);
    this._startTimeCounter();
    this._goTo("play");
  }

  _selectQuiz(e) {
    if (e.target.tagName !== "BUTTON") return;

    const selectedQuizIndex = e.target.closest(".quiz-item").dataset.index;
    const quizData = this.#allQuizzes[selectedQuizIndex];

    this._startQuiz(selectedQuizIndex, quizData);
  }

  _selectRandomQuiz() {
    const lastQuizIndex = this.#allQuizzes.length - 1;
    const randomIndex = this._getRandomBetween(0, lastQuizIndex);
    const quizData = this.#allQuizzes[randomIndex];

    this._startQuiz(randomIndex, quizData);
  }

  // ---PLAY---
  _chooseAnswer(e) {
    if (e.target.tagName !== "LI") return;

    const selectedAnswer = e.target;
    const allAnswers = selectedAnswer.closest("ul").children;

    for (let answ of allAnswers) {
      answ.classList.remove("chosen");
    }

    selectedAnswer.classList.add("chosen");
  }

  _switchQuestion(e) {
    const curBtn = e.target;
    const curQuestElem = e.target
      .closest(".play")
      .querySelector(".slide:not(.hidden)");

    const curQuiz = this.#allQuizzes[this.#currentQuizIndex];
    const curQuestIndex = +curQuestElem.dataset.questionIndex;
    const curQuizLength = curQuiz.length;
    const lastQuestIndex = curQuizLength - 1;

    const curQuizData = {
      curQuiz,
      curQuestIndex,
      curQuizLength,
      lastQuestIndex,
    };
    console.log(curQuizData);

    if (curBtn.classList.contains("btn-left")) {
      this._goToPrevQuestion(curQuestElem, curQuizData);
    }

    if (
      curBtn.classList.contains("btn-right") &&
      this._isAnswChosen(curQuestElem)
    ) {
      this._goToNextQuestion(curQuestElem, curQuizData);
    }
  }

  _goToPrevQuestion(curQuestElem, quizData) {
    const { curQuestIndex, lastQuestIndex } = quizData;

    if (curQuestIndex === 0) {
      return;
    }

    if (curQuestIndex === lastQuestIndex) {
      btnRight.style.display = "block";
      btnFinish.style.display = "none";
    }
    const prevQuestElem = curQuestElem.previousElementSibling;

    // main case
    this._hide(curQuestElem);
    this._show(prevQuestElem);
  }

  _goToNextQuestion(curQuestElem, quizData) {
    const chosenAnswer = curQuestElem.querySelector(".answer-option.chosen")
      .innerHTML;
    this.#gameData.answers.chosen.push(chosenAnswer);

    const { curQuestIndex, lastQuestIndex } = quizData;

    const nextQuestIndex = curQuestIndex + 1;
    const nextQuestElem = curQuestElem.nextElementSibling;

    // main case
    if (nextQuestIndex <= lastQuestIndex) {
      this._hide(curQuestElem);
      this._show(nextQuestElem);
    }

    // one before the last case
    if (nextQuestIndex === lastQuestIndex) {
      btnRight.style.display = "none";
      btnFinish.style.display = "block";
    }

    // last question case
    if (curQuestIndex === lastQuestIndex) {
      this._finishQuiz();
    }
  }

  _finishQuiz() {
    this.#quizInProgress = false;

    this._calculateResults();
    this._renderResults();
    this._goTo("finish");
    this._renderChart();
    this._renderStats();

    this._updateStats(
      this.#gameData.general.questions,
      this.#gameData.results.timeSec
    );

    this._setLocalStorage();
    this._resetQuizData();
  }

  // ---STATS---
  _updateStats(questionsAmount, timeSec) {
    this.#stats.quizzesPlayed++;
    this.#stats.questionsAnswered += questionsAmount;
    this.#stats.totalSec += timeSec;

    const quizzesPlayed = this.#stats.quizzesPlayed;
    const totalSec = this.#stats.totalSec;

    this.#stats.avgAnswTime = this._calculateAvgAnswTime(
      quizzesPlayed,
      totalSec
    );

    console.log(quizzesPlayed, totalSec);
  }

  // ---RENDER FUNCTIONS---
  // HOME
  _renderQuizItem(quizIndex) {
    const quizData = this.#allQuizzes[quizIndex];
    const questions = quizData.length;
    const category = quizData[1].category;

    const html = `
    <div class="quiz-item" data-index="${quizIndex}">
      <h2>${category}</h2>
      <p>Questions: ${questions}</p>
      <button class="play-btn mix">Play</button>
    </div>
    `;

    quizListContainer.insertAdjacentHTML("beforeEnd", html);
  }

  _renderAllQuizzes() {
    const quizzesAmount = this.#allQuizzes.length;
    for (let i = 0; i < quizzesAmount; i++) {
      this._renderQuizItem(i);
    }
  }

  // PLAY
  _renderQuestions(quizData) {
    slidesContainer.innerHTML = "";
    btnRight.style.display = "block";
    btnFinish.style.display = "none";

    let questionNum = 1;

    quizData.forEach((quizItem, i, quiz) => {
      const {
        category,
        difficulty,
        question,
        correct_answer,
        incorrect_answers,
      } = quizItem;

      const answers = this._getShuffledArray(
        [correct_answer],
        incorrect_answers
      );

      let answersStr = "";
      answers.forEach((answer) => {
        answersStr += `<li class="answer-option">${answer}</li>`;
      });

      const points = this.#pointsObj[difficulty];
      this.#gameData.answers.maxPoints.push(points);
      this.#gameData.answers.correct.push(correct_answer);
      this.#gameData.general.maxPoints += points;
      this.#gameData.general.questions = quiz.length;

      for (const [key, value] of Object.entries(this.#pointsObj)) {
        const questionsAmount = this.#gameData.answers.maxPoints.filter(
          (points) => points === value
        ).length;
        this.#gameData.questionsByDifficulty[key].total = questionsAmount;
      }

      const html = `
        <div class="slide current-quiz-wrapper ${
          questionNum > 1 ? "hidden" : ""
        }" data-question-index="${i}">
          <div class="quiz-info-container flex-wrapper">
            <p class="quiz-name">${category}</p>
            <span class="questions-counter">${questionNum}/${quiz.length}</span>
          </div>

          <div class="question-container"></div>
            <div class="flex-wrapper">
              <h2 class="question-num">Question #${questionNum}:</h2>
              <span class="question-difficulty ${difficulty}">${difficulty} <span class=points>(${points} points)</span></span>
            </div>
            <h3 class="question-content">${question}</h3>
            <ul class="answer-options">${answersStr}</ul>
          </div>
        </div>
      `;
      slidesContainer.insertAdjacentHTML("beforeend", html);

      questionNum++;
    });
  }

  // FINISH
  _renderResults() {
    resultsContainer.innerHTML = "";
    const { maxPoints, questions } = this.#gameData.general;

    const {
      correctAnswers,
      points,
      score,
      timeFormatted,
    } = this.#gameData.results;

    const { easy, medium, hard } = this.#gameData.questionsByDifficulty;

    const html = `
      <h2>Your Results:</h2>
      <ul class="results-list">
      <li class="result-item flex-wrapper">Time used: <span class="result">${timeFormatted}</span></li>
      <li class="result-item flex-wrapper">Score: <span class="result">${score} %</span></li>
        <li class="result-item flex-wrapper">Points: <span class="result">${points} / ${maxPoints}</span></li>
        <li class="result-item flex-wrapper">Correct answers: <span class="result">${correctAnswers} / ${questions}</span></li>
        <li  class="result-item">
          Correct by difficutly:
          <table>
            <tr class="difficulty-row">
              <td class="easy">easy</td>
              <td class="medium">medium</td>
              <td class="hard">hard</td>
            </tr>
            <tr class="results-row">
              <td class="easy">${easy.correct} / ${easy.total}</td>
              <td class="medium">${medium.correct} / ${medium.total}</td>
              <td class="hard">${hard.correct} / ${hard.total}</td>
            </tr>
          </table>
        </li>
      </ul>
    `;

    resultsContainer.insertAdjacentHTML("beforeend", html);
  }

  // STATS
  _renderStats() {
    statsInfoContainer.innerHTML = "";

    const { quizzesPlayed, questionsAnswered, avgAnswTime } = this.#stats;
    const html = `
      <h2>Your Statistic:</h2>

      <table class="stats-table">
        <tr>
          <td>Quizzes played:</td>
          <td class="stats-data">${quizzesPlayed}</td>
        </tr>
        <tr>
          <td>Questions answered:</td>
          <td class="stats-data">${questionsAnswered}</td>
        </tr>
        <tr>
          <td>Average answering time:</td>
          <td class="stats-data">${avgAnswTime}</td>
        </tr>
      </table>
    `;

    statsInfoContainer.insertAdjacentHTML("beforeend", html);

    this._renderChart();
  }

  _renderChart() {
    const xValues = ["Correct", "Wrong"];
    const { correctAnswers, wrongAnswers } = this.#stats;
    const yValues = [correctAnswers, wrongAnswers];
    const barColors = ["#00aba9", "#b91d47"];

    new Chart(pieDiagram, {
      type: "pie",
      data: {
        labels: xValues,
        datasets: [
          {
            backgroundColor: barColors,
            data: yValues,
          },
        ],
      },
      options: {
        responsive: true,
      },
    });
  }

  // ---CALCULATIONS---
  _calculateScore(correct, max) {
    return ((correct * 100) / max).toFixed(0);
  }

  _calculateAvgAnswTime(totalQuizzes, totalTime) {
    const avgAnswTime = (totalTime / totalQuizzes).toFixed(0);

    // convert seconds to 00:00 form
    console.log("totalTime", totalTime);
    console.log("totalQuizzes", totalQuizzes);
    console.log(avgAnswTime, "avgAnswTime");
    const [min, sec] = this._formatTime(avgAnswTime);

    console.log("min", min, "sec", sec);

    return `${min}:${sec}`;
  }

  _calculateResults() {
    const chosenArr = this.#gameData.answers.chosen;
    const correctArr = this.#gameData.answers.correct;
    const pointsArr = this.#gameData.answers.maxPoints;
    const questionsAmount = chosenArr.length;

    for (let i = 0; i < questionsAmount; i++) {
      if (chosenArr[i] === correctArr[i]) {
        this.#gameData.results.points += pointsArr[i];
        this.#gameData.results.correctAnswers++;

        const difficulty = Object.keys(this.#pointsObj).find(
          (key) => this.#pointsObj[key] === pointsArr[i]
        );
        this.#gameData.questionsByDifficulty[difficulty].correct++;
      }
    }

    const correctAmount = this.#gameData.results.correctAnswers;
    const wrongAmount = questionsAmount - correctAmount;

    this.#stats.correctAnswers += correctAmount;
    this.#stats.wrongAnswers += wrongAmount;

    this.#gameData.results.score = this._calculateScore(
      correctAmount,
      questionsAmount
    );
  }

  // ---HELPER FUNCTIONS---
  _isAnswChosen(questEl) {
    const curAnswers = questEl.querySelectorAll(".answer-option");
    return [...curAnswers].some((answ) => answ.classList.contains("chosen"));
  }

  _getRandomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  // SHUFFLING QUIZ ANSWERS
  _shuffleArray(array) {
    let currentIndex = array.length;
    let randomIndex;

    while (currentIndex !== 0) {
      // Pick a remaining element
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }

  _getShuffledArray(arr1, arr2 = []) {
    const mergedArrays = [...arr1, ...arr2];
    const shuffledArray = this._shuffleArray(mergedArrays);
    return shuffledArray;
  }

  _hide(elem) {
    elem.classList.add("hidden");
  }

  _show(elem) {
    elem.classList.remove("hidden");
  }

  _formatTime(time) {
    const min = String(Math.trunc(time / 60)).padStart(2, 0);
    const sec = String(time % 60).padStart(2, 0);

    return [min, sec];
  }

  _startTimeCounter() {
    const tick = function() {
      const [min, sec] = this._formatTime(time);
      timerLabel.textContent = `${min}:${sec}`;
      this.#gameData.results.timeFormatted = `${min}:${sec}`;
      this.#gameData.results.timeSec = time;

      if (!this.#quizInProgress) clearInterval(timer);

      time++;
    };

    let time = 0;

    tick.call(this);
    const timer = setInterval(() => {
      tick.call(this);
    }, 1000);

    return timer;
  }

  _setLocalStorage() {
    localStorage.setItem("stats", JSON.stringify(this.#stats));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("stats"));
    if (!data) return;
    this.#stats = data;
  }

  _resetQuizData() {
    const answersObj = this.#gameData.answers;
    const resultsObj = this.#gameData.results;
    const generalObj = this.#gameData.general;
    const questByDifObj = this.#gameData.questionsByDifficulty;

    for (const key of Object.keys(answersObj)) {
      answersObj[key].length = 0;
    }

    for (const key of Object.keys(resultsObj)) {
      resultsObj[key] = 0;
    }

    for (const key of Object.keys(generalObj)) {
      generalObj[key] = 0;
    }

    for (const key of Object.keys(this.#gameData.questionsByDifficulty)) {
      questByDifObj[key].total = 0;
      questByDifObj[key].correct = 0;
    }
  }
}

const app = new App(10);
