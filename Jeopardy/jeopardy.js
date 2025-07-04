document.addEventListener("DOMContentLoaded", function () {
  // You only need to touch comments with the todo of this file to complete the assignment!

  /*
  === How to build on top of the starter code? ===
  
  Problems have multiple solutions.
  We have created a structure to help you on solving this problem.
  On top of the structure, we created a flow shaped via the below functions.
  We left descriptions, hints, and to-do sections in between.
  If you want to use this code, fill in the to-do sections.
  However, if you're going to solve this problem yourself in different ways, you can ignore this starter code.
   */

  /*
  === Terminology for the API ===
  
  Clue: The name given to the structure that contains the question and the answer together.
  Category: The name given to the structure containing clues on the same topic.
   */

  /*
  === Data Structure of Request the API Endpoints ===
  
  /categories:
  [
    {
      "id": <category ID>,
      "title": <category name>,
      "clues_count": <number of clues in the category where each clue has a question, an answer, and a value>
    },
    ... more categories
  ]
  
  /category:
  {
    "id": <category ID>,
    "title": <category name>,
    "clues_count": <number of clues in the category>,
    "clues": [
      {
        "id": <clue ID>,
        "answer": <answer to the question>,
        "question": <question>,
        "value": <value of the question (be careful not all questions have values) (Hint: you can assign your own value such as 200 or skip)>,
        ... more properties
      },
      ... more clues
    ]
  }
   */
  const API_URL = "https://rithm-jeopardy.herokuapp.com/api/"; // The URL of the API.
  const NUMBER_OF_CATEGORIES = 6; // The number of categories you will be fetching. You can change this number.
  const NUMBER_OF_CLUES_PER_CATEGORY = 5; // The number of clues you will be displaying per category. You can change this number.

  let categories = []; // The categories with clues fetched from the API.
  /*
  [
    {
      "id": <category ID>,
      "title": <category name>,
      "clues": [
        {
          "id": <clue ID>,
          "value": <value (e.g. $200)>,
          "question": <question>,
          "answer": <answer>
        },
        ... more categories
      ]
    },
    ... more categories
  ]
   */
  let activeClue = null; // Currently selected clue data.
  let activeClueMode = 0; // Controls the flow of #active-clue element while selecting a clue, displaying the question of selected clue, and displaying the answer to the question.
  /*
  0: Empty. Waiting to be filled. If a clue is clicked, it shows the question (transits to 1).
  1: Showing a question. If the question is clicked, it shows the answer (transits to 2).
  2: Showing an answer. If the answer is clicked, it empties (transits back to 0).
   */

  let isPlayButtonClickable = true; // Only clickable when the game haven't started yet or ended. Prevents the button to be clicked during the game.

  //event handler when start or restart clicked
  $("#play").on("click", handleClickOfPlay);

  /**
   * Manages the behavior of the play button (start or restart) when clicked.
   * Sets up the game.
   *
   * Hints:
   * - Sets up the game when the play button is clickable.
   */
  function handleClickOfPlay() {
    if (!isPlayButtonClickable) return;
    isPlayButtonClickable = false;
    setupTheGame();
  }

  /**
   * Sets up the game.
   *
   * 1. Cleans the game since the user can be restarting the game.
   * 2. Get category IDs
   * 3. For each category ID, get the category with clues.
   * 4. Fill the HTML table with the game data.
   *
   * Hints:
   * - The game play is managed via events.
   */
  async function setupTheGame() {
    // Show spinner
    $("#spinner").removeClass("disabled");

    // Reset UI
    $("#categories").empty();
    $("#clues").empty();
    $("#active-clue").empty();
    $("#play").text("Game in Progress...");

    // Fetch game data
    const categoryIds = await getCategoryIds();
    const categoryDataPromises = categoryIds.map((id) => getCategoryData(id));
    categories = await Promise.all(categoryDataPromises);

    // Fill the table
    fillTable(categories);

    // Hide spinner
    $("#spinner").addClass("disabled");
  }

  /**
   * Gets as many category IDs as in the `NUMBER_OF_CATEGORIES` constant.
   * Returns an array of numbers where each number is a category ID.
   *
   * Hints:
   * - Use /categories endpoint of the API.
   * - Request as many categories as possible, such as 100. Randomly pick as many categories as given in the `NUMBER_OF_CATEGORIES` constant, if the number of clues in the category is enough (<= `NUMBER_OF_CLUES` constant).
   */
  async function getCategoryIds() {
    const res = await axios.get(`${API_URL}categories?count=100`);
    const allCategories = res.data;

    const validCategories = allCategories.filter(
      (cat) => cat.clues_count >= NUMBER_OF_CLUES_PER_CATEGORY
    );
    const selectedCategories = [];

    while (
      selectedCategories.length < NUMBER_OF_CATEGORIES &&
      validCategories.length > 0
    ) {
      const randIndex = Math.floor(Math.random() * validCategories.length);
      const category = validCategories.splice(randIndex, 1)[0];
      selectedCategories.push(category.id);
    }
    return selectedCategories;
  }

  /**
   * Gets category with as many clues as given in the `NUMBER_OF_CLUES` constant.
   * Returns the below data structure:
   *  {
   *    "id": <category ID>
   *    "title": <category name>
   *    "clues": [
   *      {
   *        "id": <clue ID>,
   *        "value": <value of the question>,
   *        "question": <question>,
   *        "answer": <answer to the question>
   *      },
   *      ... more clues
   *    ]
   *  }
   *
   * Hints:
   * - You need to call this function for each category ID returned from the `getCategoryIds` function.
   * - Use /category endpoint of the API.
   * - In the API, not all clues have a value. You can assign your own value or skip that clue.
   */
  async function getCategoryData(categoryId) {
    const res = await axios.get(`${API_URL}category?id=${categoryId}`);
    const data = await res.data;

    const clues = data.clues
      .filter((clue) => clue.question && clue.answer)
      .slice(0, NUMBER_OF_CLUES_PER_CATEGORY)
      .map((clue, i) => ({
        id: clue.id,
        question: clue.question,
        answer: clue.answer,
        value: clue.value || (i + 1) * 100,
      }));

    return {
      id: data.id,
      title: data.title,
      clues,
    };
  }

  /**
   * Fills the HTML table using category data.
   *
   * Hints:
   * - You need to call this function using an array of categories where each element comes from the `getCategoryData` function.
   * - Table head (thead) has a row (#categories).
   *   For each category, you should create a cell element (th) and append that to it.
   * - Table body (tbody) has a row (#clues).
   *   For each category, you should create a cell element (td) and append that to it.
   *   Besides, for each clue in a category, you should create a row element (tr) and append it to the corresponding previously created and appended cell element (td).
   * - To this row elements (tr) should add an event listener (handled by the `handleClickOfClue` function) and set their IDs with category and clue IDs. This will enable you to detect which clue is clicked.
   */
  function fillTable(categories) {
    // todo
    const $CatRow = $("<tr>");
    for (let cat of categories) {
      // Add category header
      const $catCell = $(`
        <th>
          <div class="catTitle">${cat.title.toUpperCase()}
          </div>
        </th>
      `);
      //$("#categories").append(`<th>${cat.title}</th>`);
      $CatRow.append($catCell);
    }
    $("#categories").append($CatRow);
    // Build table cells with rows inside each column
    for (
      let clueIndex = 0;
      clueIndex < NUMBER_OF_CLUES_PER_CATEGORY;
      clueIndex++
    ) {
      const $row = $("<tr>");
      for (let catIndex = 0; catIndex < categories.length; catIndex++) {
        const clue = categories[catIndex].clues[clueIndex];
        const $cell = $(`
          <td>
            <div class="clue" id="cat-${categories[catIndex].id}-clue-${clue.id}">
              $${clue.value}
            </div>
          </td>
        `);
        $row.append($cell);
      }
      $("#clues").append($row);
    }
    // Rebind event listener after dynamic creation
    $(".clue").on("click", handleClickOfClue);
  }

  // I have commented this
  //$(".clue").on("click", handleClickOfClue);

  /**
   * Manages the behavior when a clue is clicked.
   * Displays the question if there is no active question.
   *
   * Hints:
   * - Control the behavior using the `activeClueMode` variable.
   * - Identify the category and clue IDs using the clicked element's ID.
   * - Remove the clicked clue from categories since each clue should be clickable only once. Don't forget to remove the category if all the clues are removed.
   * - Don't forget to update the `activeClueMode` variable.
   *
   */

  function handleClickOfClue(event) {
    if (activeClueMode !== 0) return;

    const clueId = $(event.currentTarget).attr("id");

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const clueIndex = category.clues.findIndex(
        (c) => `cat-${category.id}-clue-${c.id}` === clueId
      );
      if (clueIndex !== -1) {
        // Set active clue and display question
        activeClue = category.clues[clueIndex];
        activeClueMode = 1;
        $("#active-clue").html(
          `<strong> Question: </strong> ${activeClue.question}`
        );

        // Remove this clue from category
        category.clues.splice(clueIndex, 1);

        // remove clues from categories If category has no more clues,
        if (category.clues.length === 0) {
          categories.splice(i, 1);
        }

        // Mark clue as viewed
        $(event.currentTarget).addClass("viewed");
        break;
      }
    }
  }

  $("#active-clue").on("click", handleClickOfActiveClue);

  /**
   * Manages the behavior when a displayed question or answer is clicked.
   * Displays the answer if currently displaying a question.
   * Clears if currently displaying an answer.
   *
   * Hints:
   * - Control the behavior using the `activeClueMode` variable.
   * - After clearing, check the categories array to see if it is empty to decide to end the game.
   * - Don't forget to update the `activeClueMode` variable.
   */
  function handleClickOfActiveClue(event) {
    // todo display answer if displaying a question

    // todo clear if displaying an answer
    // todo after clear end the game when no clues are left
    if (activeClueMode === 1) {
      // activeClueMode = 2;
      $("#active-clue").html(`<strong> Answer: </strong>${activeClue.answer}`);
      // } else if (activeClueMode === 2) {
      activeClueMode = 0;
      //$("#active-clue").html("");

      // If no more categories/clues left, end game
      if (categories.length === 0) {
        $("#active-clue").html("The End!");
        $("#play").text("Restart the Game!");
        isPlayButtonClickable = true;
      }
    }
  }

  // Second options
  // playButton.addEventListener("click", setupTheGame);
});
