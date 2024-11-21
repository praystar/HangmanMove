module hangman_game::hangman {
    use std::vector;
    use std::string;
    use aptos_std::string_utils;
    use aptos_framework::account;
    use aptos_framework::event;

    /// Struct to store game state
    struct GameState has key {
        word: string::String,
        guessed_chars: vector<u8>,
        turns_left: u64,
        game_events: event::EventHandle<GameEvent>
    }

    /// Event to track game progress
    struct GameEvent has drop, store {
        event_type: string::String,
        message: string::String
    }

    /// Initialize a new game
    public entry fun initialize_game(player: &signer) {
        let words = vector[
            string::utf8(b"secret"),
            string::utf8(b"puzzle"), 
            string::utf8(b"hangman")
        ];

        // Deterministic word selection
        let player_addr = account::get_address(player);
        let seed = account::get_sequence_number(player_addr);
        let word_index = seed % vector::length(&words);
        let selected_word = *vector::borrow(&words, word_index);

        // Create game state
        let game_state = GameState {
            word: selected_word,
            guessed_chars: vector::empty(),
            turns_left: 6,
            game_events: account::new_event_handle<GameEvent>(player)
        };

        // Move the game state to the player's account
        move_to(player, game_state);
    }

    /// Guess a character in the game
    public entry fun guess_char(player: &signer, guess: u8) acquires GameState {
        let player_addr = account::get_address(player);
        let game_state = borrow_global_mut<GameState>(player_addr);

        // Check if character already guessed
        if (vector::contains(&game_state.guessed_chars, &guess)) {
            event::emit_event(&mut game_state.game_events, GameEvent {
                event_type: string::utf8(b"duplicate_guess"),
                message: string::utf8(b"Character already guessed")
            });
            return
        };

        // Add to guessed characters
        vector::push_back(&mut game_state.guessed_chars, guess);

        // Check if guess is in word
        let word_bytes = string::bytes(&game_state.word);
        if (!vector::contains(word_bytes, &guess)) {
            game_state.turns_left = game_state.turns_left - 1;
            
            event::emit_event(&mut game_state.game_events, GameEvent {
                event_type: string::utf8(b"wrong_guess"),
                message: string::utf8(b"Incorrect guess")
            });
        } else {
            event::emit_event(&mut game_state.game_events, GameEvent {
                event_type: string::utf8(b"correct_guess"),
                message: string::utf8(b"Correct guess!")
            });
        };

        // Display game state
        display_word(game_state);
    }

    /// Display the current state of the word
    fun display_word(game_state: &mut GameState) {
        let word_bytes = string::bytes(&game_state.word);
        let display = vector::empty<u8>();
        let remaining_chars = vector::length(word_bytes);

        // Build display string
        let i = 0;
        while (i < vector::length(word_bytes)) {
            let current_char = *vector::borrow(word_bytes, i);
            
            if (vector::contains(&game_state.guessed_chars, &current_char)) {
                vector::push_back(&mut display, current_char);
                remaining_chars = remaining_chars - 1;
            } else {
                vector::push_back(&mut display, b'_');
            };

            vector::push_back(&mut display, b' ');
            i = i + 1;
        };

        // Convert display to string and emit event
        let display_str = string::utf8(display);
        event::emit_event(&mut game_state.game_events, GameEvent {
            event_type: string::utf8(b"word_state"),
            message: display_str
        });

        // Check win/lose conditions
        if (remaining_chars == 0) {
            event::emit_event(&mut game_state.game_events, GameEvent {
                event_type: string::utf8(b"game_result"),
                message: string::utf8(b"Congratulations! You won!")
            });
        } else if (game_state.turns_left == 0) {
            event::emit_event(&mut game_state.game_events, GameEvent {
                event_type: string::utf8(b"game_result"),
                message: string::utf8(b"Game Over! You ran out of turns.")
            });
        };
    }

    /// Check if the game is over
    public fun is_game_over(player: address): bool acquires GameState {
        let game_state = borrow_global<GameState>(player);
        game_state.turns_left == 0
    }

    /// Remove game state when game is complete
    public entry fun cleanup_game(player: &signer) acquires GameState {
        let player_addr = account::get_address(player);
        if (is_game_over(player_addr)) {
            // Properly extract and destroy the resource
            let GameState { word: _, guessed_chars: _, turns_left: _, game_events } = move_from<GameState>(player_addr);
            
            // Destroy the event handle
            event::destroy_handle(game_events);
        };
    }
}