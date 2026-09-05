import './style.css'
import cities from './data/cities.json'

const TOTAL_QUESTIONS = 10

let questions = []
let currentQuestionIndex = 0
let score = 0
let combo = 0
let maxCombo = 0
let answered = false

const app = document.querySelector('#app')

function shuffle(array) {
return [...array].sort(() => Math.random() - 0.5)
}

function createQuestions() {
return shuffle(cities).slice(0, TOTAL_QUESTIONS)
}

function createChoices(correctPrefecture) {
const prefectures = [
...new Set(cities.map((city) => city.prefecture))
]

const wrongChoices = shuffle(
prefectures.filter(
(prefecture) => prefecture !== correctPrefecture
)
).slice(0, 3)

return shuffle([
correctPrefecture,
...wrongChoices
])
}

function showStartScreen() {
app.innerHTML = `
<main class="container">
<div class="logo">
<span class="logo-icon">🗾</span>
<span>市どこ？</span>
</div>

  <div class="start-card">
    <div class="start-emoji">🏙️</div>

    <h1>この市、何県？</h1>

    <p class="description">
      市の名前を見て、<br>
      何県にあるか当てよう！
    </p>

    <div class="rule-box">
      <div>
        <span>📝</span>
        <strong>全10問</strong>
      </div>
      <div>
        <span>🎯</span>
        <strong>4択クイズ</strong>
      </div>
      <div>
        <span>🔥</span>
        <strong>コンボあり</strong>
      </div>
    </div>

    <button id="start-button" class="primary-button">
      クイズを始める
    </button>
  </div>

  <p class="data-info">
    全国の市のデータを使用しています
  </p>
</main>


`

document
.querySelector('#start-button')
.addEventListener('click', startQuiz)
}

function startQuiz() {
questions = createQuestions()
currentQuestionIndex = 0
score = 0
combo = 0
maxCombo = 0
answered = false

showQuestion()
}

function showQuestion() {
const question = questions[currentQuestionIndex]

answered = false

const choices = createChoices(question.prefecture)

app.innerHTML = `
<main class="container">
<header class="quiz-header">
<button id="quit-button" class="quit-button">
← 終了
</button>

    <div class="progress">
      <div class="progress-text">
        ${currentQuestionIndex + 1} / ${TOTAL_QUESTIONS}
      </div>

      <div class="progress-bar">
        <div
          class="progress-fill"
          style="
            width: ${
              ((currentQuestionIndex + 1) /
                TOTAL_QUESTIONS) *
              100
            }%
          "
        ></div>
      </div>
    </div>

    <div class="score-display">
      ${score}点
    </div>
  </header>

  <section class="question-card">
    <p class="question-label">この市は何県？</p>

    <h1 class="city-name">
      ${question.city}
    </h1>

    <p class="question-hint">
      都道府県を選んでください
    </p>
  </section>

  ${
    combo > 0
      ? `
        <div class="combo">
          🔥 ${combo} COMBO!
        </div>
      `
      : ''
  }

  <section class="choices">
    ${choices
      .map(
        (choice) => `
          <button
            class="answer-button"
            data-answer="${choice}"
          >
            ${choice}
          </button>
        `
      )
      .join('')}
  </section>

  <p class="current-score">
    正解数：${score} / ${currentQuestionIndex}
  </p>
</main>


`

document
.querySelector('#quit-button')
.addEventListener('click', showStartScreen)

document
.querySelectorAll('.answer-button')
.forEach((button) => {
button.addEventListener('click', () => {
answerQuestion(
button,
question.prefecture
)
})
})
}

function answerQuestion(button, correctAnswer) {
if (answered) {
return
}

answered = true

const buttons = document.querySelectorAll(
'.answer-button'
)

buttons.forEach((item) => {
item.disabled = true
})

const selectedAnswer = button.dataset.answer
const isCorrect = selectedAnswer === correctAnswer

if (isCorrect) {
score++
combo++

if (combo > maxCombo) {
  maxCombo = combo
}

button.classList.add('correct')

showFeedback(
  true,
  '正解！',
  `${correctAnswer}です！`
)


} else {
combo = 0

button.classList.add('incorrect')

buttons.forEach((item) => {
  if (item.dataset.answer === correctAnswer) {
    item.classList.add('correct')
  }
})

showFeedback(
  false,
  '不正解！',
  `正解は ${correctAnswer} です`
)


}
}

function showFeedback(isCorrect, title, message) {
const feedback = document.createElement('div')

feedback.className = `feedback ${ isCorrect ? 'feedback-correct' : 'feedback-incorrect' }`

feedback.innerHTML = `
<div class="feedback-content">
<div class="feedback-title">
${title}
</div>

  <div class="feedback-message">
    ${message}
  </div>

  <button id="next-button" class="next-button">
    ${
      currentQuestionIndex + 1 === TOTAL_QUESTIONS
        ? '結果を見る'
        : '次の問題 →'
    }
  </button>
</div>


`

document.body.appendChild(feedback)

document
.querySelector('#next-button')
.addEventListener('click', () => {
feedback.remove()
nextQuestion()
})
}

function nextQuestion() {
currentQuestionIndex++

if (currentQuestionIndex >= TOTAL_QUESTIONS) {
showResult()
} else {
showQuestion()
}
}

function showResult() {
const percentage = Math.round(
(score / TOTAL_QUESTIONS) * 100
)

let message = ''

if (percentage === 100) {
message = '全問正解！すごい！'
} else if (percentage >= 80) {
message = 'かなり詳しい！'
} else if (percentage >= 60) {
message = 'いい感じ！もう少し！'
} else if (percentage >= 40) {
message = 'まだまだこれから！'
} else {
message = 'もう一度挑戦してみよう！'
}

app.innerHTML = `
<main class="container">
<div class="result-card">
<div class="result-emoji">
${percentage === 100 ? '🏆' : '🎉'}
</div>

    <p class="result-label">
      クイズ終了！
    </p>

    <h1 class="result-score">
      ${score}
      <span>/ ${TOTAL_QUESTIONS}</span>
    </h1>

    <p class="percentage">
      正解率 ${percentage}%
    </p>

    <div class="result-message">
      ${message}
    </div>

    <div class="stats">
      <div class="stat">
        <span class="stat-label">正解数</span>
        <strong>${score}問</strong>
      </div>

      <div class="stat">
        <span class="stat-label">最高コンボ</span>
        <strong>${maxCombo}</strong>
      </div>
    </div>

    <button
      id="retry-button"
      class="primary-button"
    >
      もう一度挑戦
    </button>

    <button
      id="home-button"
      class="secondary-button"
    >
      タイトルに戻る
    </button>
  </div>
</main>


`

document
.querySelector('#retry-button')
.addEventListener('click', startQuiz)

document
.querySelector('#home-button')
.addEventListener('click', showStartScreen)
}

showStartScreen()