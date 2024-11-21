module 0x94fa288c855eccfa184bdfff247a74a7698106721a79be0dc37a6ac6789a4a3d::hangman {
    use std::vector;
    use std::string::{Self, String};
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::signer;

    /// Represents the state of a Hangman game
    struct GameState has key {
        word: vector<u8>,
        guessed_letters: vector<u8>,
        remaining_attempts: u8,
        game_over: bool,
    }

    /// Constants
    const MAX_ATTEMPTS: u8 = 6;

    /// Errors
    const E_GAME_NOT_INITIALIZED: u64 = 1;
    const E_GAME_ALREADY_INITIALIZED: u64 = 2;
    const E_GAME_OVER: u64 = 3;
    const E_INVALID_GUESS: u64 = 4;

    /// Initializes a new Hangman game for the account
    public entry fun initialize_game(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(!exists<GameState>(account_addr), E_GAME_ALREADY_INITIALIZED);

        let chosen_word = get_random_word_deterministic();

        move_to(account, GameState {
            word: chosen_word,
            guessed_letters: vector::empty(),
            remaining_attempts: MAX_ATTEMPTS,
            game_over: false,
        });
    }

    /// Makes a guess in the Hangman game
    public entry fun make_guess(account: &signer, letter: u8) acquires GameState {
        let account_addr = signer::address_of(account);
        assert!(exists<GameState>(account_addr), E_GAME_NOT_INITIALIZED);
        
        let game_state = borrow_global_mut<GameState>(account_addr);
        assert!(!game_state.game_over, E_GAME_OVER);
        assert!(letter >= 97 && letter <= 122, E_INVALID_GUESS); // Ensure lowercase a-z

        if (!vector::contains(&game_state.guessed_letters, &letter)) {
            vector::push_back(&mut game_state.guessed_letters, letter);
            
            if (!vector::contains(&game_state.word, &letter)) {
                game_state.remaining_attempts = game_state.remaining_attempts - 1;
            };
        };

        // Check if the game is over
        game_state.game_over = game_state.remaining_attempts == 0 || 
                               is_word_guessed(&game_state.word, &game_state.guessed_letters);
    }

    /// Resets the game for the account
    public entry fun reset_game(account: &signer) acquires GameState {
        let account_addr = signer::address_of(account);
        assert!(exists<GameState>(account_addr), E_GAME_NOT_INITIALIZED);

        let game_state = borrow_global_mut<GameState>(account_addr);
        game_state.word = get_random_word_deterministic();
        game_state.guessed_letters = vector::empty();
        game_state.remaining_attempts = MAX_ATTEMPTS;
        game_state.game_over = false;
    }

    /// Gets the current game state
    public fun get_game_state(account_addr: address): (vector<u8>, vector<u8>, u8, bool) acquires GameState {
        assert!(exists<GameState>(account_addr), E_GAME_NOT_INITIALIZED);
        let game_state = borrow_global<GameState>(account_addr);
        (game_state.word, game_state.guessed_letters, game_state.remaining_attempts, game_state.game_over)
    }

    /// Checks if the game is won
    public fun is_game_won(account_addr: address): bool acquires GameState {
        assert!(exists<GameState>(account_addr), E_GAME_NOT_INITIALIZED);
        let game_state = borrow_global<GameState>(account_addr);
        is_word_guessed(&game_state.word, &game_state.guessed_letters)
    }

    /// Helper function to check if all letters in the word have been guessed
    fun is_word_guessed(word: &vector<u8>, guessed_letters: &vector<u8>): bool {
        let i = 0;
        let len = vector::length(word);
        while (i < len) {
            let letter = vector::borrow(word, i);
            if (!vector::contains(guessed_letters, letter)) {
                return false
            };
            i = i + 1;
        };
        true
    }

    /// Helper function to deterministically select a word
    fun get_random_word_deterministic(): vector<u8> {
        let words = vector[
            b"aptos",
            b"blockchain",
            b"crypto",
            b"decentralized",
            b"finance",
            b"smart",
            b"contract",
            b"wallet",
            b"token",
            b"network",
            b"stackup"
        ];
        
        let seed = timestamp::now_microseconds();
        let index = seed % (vector::length(&words) as u64);
        *vector::borrow(&words, (index as u64))
    }
}
