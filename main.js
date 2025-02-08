// Wrap everything in an IIFE to avoid polluting the global scope.
(() => {
    const { useState, useEffect, useRef } = React;

    // ========= Constants ============
    const CARD_WIDTH = 225;
    const CARD_HEIGHT = 315;
    const TABLE_WIDTH = 800;
    const TABLE_HEIGHT = 600;
    const CARD_SPACING = 60;
    const INITIAL_BALANCE = 1000;

    // ========= Utility Functions ============
    // Create a standard 52-card deck.
    function createDeck() {
        const suits = ['C', 'D', 'H', 'S'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck = [];
        for (let s of suits) {
            for (let r of ranks) {
                deck.push({ rank: r, suit: s });
            }
        }
        return shuffle(deck);
    }

    // Fisher–Yates shuffle.
    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // Determine the value of a card.
    function cardValue(card) {
        if (['J', 'Q', 'K'].includes(card.rank)) {
            return 10;
        } else if (card.rank === 'A') {
            return 11;
        } else {
            return parseInt(card.rank, 10);
        }
    }

    // Calculate the total value of a hand with Ace adjustments.
    function handValue(hand) {
        let total = 0, aces = 0;
        hand.forEach(card => {
            total += cardValue(card);
            if (card.rank === 'A') aces++;
        });
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return total;
    }

    // Compute final positions for cards in a hand.
    function computeHandPositions(handLength, y) {
        if (handLength === 0) return [];
        const positions = [];
        const totalWidth = CARD_WIDTH + (handLength - 1) * CARD_SPACING;
        const startX = (TABLE_WIDTH - totalWidth) / 2;
        for (let i = 0; i < handLength; i++) {
            positions.push({ x: startX + i * CARD_SPACING, y });
        }
        return positions;
    }

    // ========= Card Component ============
    // This component animates a card from the deck center to its final position.
    function CardComponent({ card, index, faceDown, finalPosition }) {
        const deckCenter = {
            x: (TABLE_WIDTH - CARD_WIDTH) / 2,
            y: (TABLE_HEIGHT - CARD_HEIGHT) / 2,
        };
        const [position, setPosition] = useState(deckCenter);
        const src = faceDown
            ? 'assets/cards/BACK.svg'
            : `assets/cards/${card.rank}${card.suit}.svg`;
        useEffect(() => {
            const timer = setTimeout(() => {
                setPosition(finalPosition);
            }, 100);
            return () => clearTimeout(timer);
        }, [finalPosition]);
        return React.createElement('img', {
            src,
            alt: faceDown ? 'Back of card' : `${card.rank}${card.suit}`,
            className: 'card',
            style: {
                left: position.x + 'px',
                top: position.y + 'px',
                width: CARD_WIDTH + 'px',
                height: CARD_HEIGHT + 'px',
            },
            key: index,
        });
    }

    // ========= Help Modal Component ============
    function HelpModal({ onClose }) {
        return React.createElement(
            'div',
            { className: 'help-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'help-title' },
            React.createElement(
                'div',
                { className: 'help-content' },
                React.createElement('h2', { id: 'help-title' }, 'How to Play'),
                React.createElement(
                    'ul',
                    null,
                    React.createElement('li', null, 'Deal: Start a new round by placing a bet. (Shortcut: D)'),
                    React.createElement('li', null, 'Hit: Request an additional card. (Shortcut: H)'),
                    React.createElement('li', null, 'Stand: End your turn and let the dealer play. (Shortcut: S)'),
                    React.createElement('li', null, 'Restart: Reset the game to its initial state. (Shortcut: R)'),
                    React.createElement('li', null, 'Share Score: Generate your social media score card. (Shortcut: C)'),
                    React.createElement('li', null, 'Help: Toggle these instructions. (Shortcut: I)')
                ),
                React.createElement(
                    'button',
                    { onClick: onClose, 'aria-label': 'Close help modal' },
                    'Close'
                )
            )
        );
    }

    // ========= Score Card Modal Component ============
    // Generates a score card image on a canvas using a Soviet-inspired background
    // drawn entirely with canvas commands. The background is a dark red-to-black gradient
    // with subtle star decorations, and the text (in Courier New) is rendered with drop shadows.
    function ScoreCardModal({ highScore, onClose }) {
        const canvasRef = useRef(null);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            // Clear the canvas.
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Create a linear gradient background (dark red to black).
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, "#8B0000"); // Dark red
            gradient.addColorStop(1, "#000000"); // Black
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add subtle star-like decorations.
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            for (let i = 0; i < 12; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const size = Math.random() * 3 + 2;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, 2 * Math.PI);
                ctx.fill();
            }

            // Draw border.
            ctx.strokeStyle = "#fcd116";
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);

            // Setup text properties with drop shadow.
            ctx.fillStyle = "#fcd116";
            ctx.textAlign = "center";
            ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowBlur = 4;

            // Use monospaced font (Courier New) for Soviet aesthetics.
            ctx.font = "bold 36px Courier New, monospace";
            ctx.fillText("Blackjack – Soviet Edition", canvas.width / 2, 60);
            ctx.font = "bold 48px Courier New, monospace";
            ctx.fillText(`High Score: $${highScore}`, canvas.width / 2, canvas.height / 2);
            ctx.font = "24px Courier New, monospace";
            ctx.fillText("I beat the house!", canvas.width / 2, canvas.height - 60);

            // Reset shadow.
            ctx.shadowColor = "transparent";
        }, [highScore]);

        const downloadImage = () => {
            const canvas = canvasRef.current;
            try {
                const link = document.createElement("a");
                link.download = "blackjack_scorecard.png";
                link.href = canvas.toDataURL("image/png");
                link.click();
            } catch (err) {
                console.error("Error generating image:", err);
                alert("There was an error generating your score card. Please try again from a web server.");
            }
        };

        return React.createElement(
            "div",
            { className: "scorecard-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "scorecard-title" },
            React.createElement(
                "div",
                { className: "scorecard-content" },
                React.createElement("h2", { id: "scorecard-title" }, "Your Score Card"),
                React.createElement("canvas", { ref: canvasRef, width: 600, height: 400 }),
                React.createElement("div", null,
                    React.createElement("button", { onClick: downloadImage, "aria-label": "Download Score Card" }, "Download"),
                    React.createElement("button", { onClick: onClose, "aria-label": "Close Score Card" }, "Close")
                )
            )
        );
    }

    // ========= Main Game Component ============
    function BlackjackGame() {
        const [balance, setBalance] = useState(INITIAL_BALANCE);
        const [bet, setBet] = useState('');
        const [deck, setDeck] = useState(createDeck());
        const [playerHand, setPlayerHand] = useState([]);
        const [dealerHand, setDealerHand] = useState([]);
        const [inRound, setInRound] = useState(false);
        const [message, setMessage] = useState('');
        const [disableDeal, setDisableDeal] = useState(false);
        const [disableHitStand, setDisableHitStand] = useState(true);
        const [showHelp, setShowHelp] = useState(false);
        const [showScoreCard, setShowScoreCard] = useState(false);
        const [highScore, setHighScore] = useState(INITIAL_BALANCE);

        // Update high score if current balance exceeds it.
        useEffect(() => {
            if (balance > highScore) {
                setHighScore(balance);
            }
        }, [balance]);

        // Start a new round – deduct bet and deal cards.
        const startRound = () => {
            const betValue = parseInt(bet, 10);
            if (isNaN(betValue) || betValue <= 0) {
                setMessage("Invalid bet. Please enter a positive number.");
                return;
            }
            if (betValue > balance) {
                setMessage("Bet exceeds available balance.");
                return;
            }
            setBalance(prev => prev - betValue);
            setMessage("");
            const newDeck = createDeck();
            const playerCards = [];
            const dealerCards = [];
            playerCards.push(newDeck.pop());
            dealerCards.push(newDeck.pop());
            playerCards.push(newDeck.pop());
            dealerCards.push(newDeck.pop());
            setDeck(newDeck);
            setPlayerHand(playerCards);
            setDealerHand(dealerCards);
            setInRound(true);
            setDisableDeal(true);
            setDisableHitStand(false);
        };

        // Process a Hit – add a card to the player's hand.
        const hit = () => {
            if (!inRound) return;
            const newDeck = [...deck];
            const newPlayerHand = [...playerHand, newDeck.pop()];
            setDeck(newDeck);
            setPlayerHand(newPlayerHand);
            if (handValue(newPlayerHand) > 21) {
                setMessage("Bust! You lose.");
                setInRound(false);
                setDisableHitStand(true);
                settleBet("lose");
            }
        };

        // Process Stand – let the dealer play.
        const stand = () => {
            if (!inRound) return;
            let newDeck = [...deck];
            let newDealerHand = [...dealerHand];
            while (handValue(newDealerHand) < 17) {
                newDealerHand.push(newDeck.pop());
            }
            setDeck(newDeck);
            setDealerHand(newDealerHand);
            setInRound(false);
            setDisableHitStand(true);
            const playerTotal = handValue(playerHand);
            const dealerTotal = handValue(newDealerHand);
            let outcome = "";
            if (dealerTotal > 21) {
                outcome = "win";
                setMessage("Dealer busts! You win!");
            } else if (playerTotal > dealerTotal) {
                outcome = "win";
                setMessage("Congratulations, you win!");
            } else if (playerTotal < dealerTotal) {
                outcome = "lose";
                setMessage("Sorry, you lose.");
            } else {
                outcome = "push";
                setMessage("It's a tie!");
            }
            settleBet(outcome);
        };

        // Settle the bet based on outcome.
        const settleBet = (outcome) => {
            const betValue = parseInt(bet, 10);
            if (outcome === "win") {
                setBalance(prev => prev + betValue * 2);
            } else if (outcome === "push") {
                setBalance(prev => prev + betValue);
            }
            setDisableDeal(false);
        };

        // Reset the game state.
        const resetGame = () => {
            setBalance(INITIAL_BALANCE);
            setBet('');
            setPlayerHand([]);
            setDealerHand([]);
            setDeck(createDeck());
            setInRound(false);
            setMessage("");
            setDisableDeal(false);
            setDisableHitStand(true);
        };

        // Toggle the help modal.
        const toggleHelp = () => {
            setShowHelp(prev => !prev);
        };

        // Toggle the score card modal.
        const toggleScoreCard = () => {
            if (highScore <= INITIAL_BALANCE) {
                setMessage("Your score is too low to share. Beat the house to unlock this feature!");
                return;
            }
            setShowScoreCard(prev => !prev);
        };

        // Keyboard support for intuitive play.
        useEffect(() => {
            const handleKeyDown = (e) => {
                if (e.target.tagName === 'INPUT') return;
                const key = e.key.toLowerCase();
                if (key === 'd' && !disableDeal) {
                    startRound();
                } else if (key === 'h' && !disableHitStand) {
                    hit();
                } else if (key === 's' && !disableHitStand) {
                    stand();
                } else if (key === 'r') {
                    resetGame();
                } else if (key === 'i') {
                    toggleHelp();
                } else if (key === 'c') {
                    toggleScoreCard();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [disableDeal, disableHitStand, inRound, bet, deck, playerHand, dealerHand, highScore]);

        const dealerY = 20;
        const playerY = TABLE_HEIGHT - CARD_HEIGHT - 20;
        const dealerPositions = computeHandPositions(dealerHand.length, dealerY);
        const playerPositions = computeHandPositions(playerHand.length, playerY);

        return React.createElement('div', { className: 'container' },
            React.createElement('h1', { style: { textAlign: 'center' } }, "Blackjack – Soviet Edition"),
            React.createElement('div', { className: 'table', 'aria-label': 'Game Table' },
                dealerHand.map((card, idx) => {
                    const faceDown = inRound && idx === 1;
                    return React.createElement(CardComponent, {
                        card,
                        index: idx,
                        faceDown,
                        finalPosition: dealerPositions[idx]
                    });
                }),
                playerHand.map((card, idx) => {
                    return React.createElement(CardComponent, {
                        card,
                        index: idx,
                        faceDown: false,
                        finalPosition: playerPositions[idx]
                    });
                })
            ),
            React.createElement('div', { className: 'balance-info' },
                `Balance: $${balance} Your Hand: ${handValue(playerHand)} High Score: $${highScore}`
            ),
            React.createElement('div', { className: 'message' }, message),
            React.createElement('div', { className: 'controls', style: { textAlign: 'center', marginTop: '20px' } },
                React.createElement('input', {
                    type: 'number',
                    value: bet,
                    onChange: (e) => setBet(e.target.value),
                    placeholder: "Enter bet",
                    disabled: inRound,
                    'aria-label': 'Bet Amount'
                }),
                React.createElement('button', {
                    onClick: startRound,
                    disabled: disableDeal,
                    'data-tooltip': 'Deal (D)',
                    'aria-label': 'Deal'
                }, "Deal"),
                React.createElement('button', {
                    onClick: hit,
                    disabled: disableHitStand,
                    'data-tooltip': 'Hit (H)',
                    'aria-label': 'Hit'
                }, "Hit"),
                React.createElement('button', {
                    onClick: stand,
                    disabled: disableHitStand,
                    'data-tooltip': 'Stand (S)',
                    'aria-label': 'Stand'
                }, "Stand"),
                React.createElement('button', {
                    onClick: resetGame,
                    'data-tooltip': 'Restart (R)',
                    'aria-label': 'Restart'
                }, "Restart"),
                React.createElement('button', {
                    onClick: toggleHelp,
                    'data-tooltip': 'Help (I)',
                    'aria-label': 'Help'
                }, "Help"),
                React.createElement('button', {
                    onClick: toggleScoreCard,
                    disabled: highScore <= INITIAL_BALANCE,
                    'data-tooltip': highScore <= INITIAL_BALANCE
                        ? 'Score too low to share. Beat the house to unlock this feature.'
                        : 'Share Score (C)',
                    'aria-label': 'Share Score'
                }, "Share Score")
            ),
            showHelp && React.createElement(HelpModal, { onClose: toggleHelp }),
            showScoreCard && React.createElement(ScoreCardModal, { highScore, onClose: toggleScoreCard })
        );
    }

    ReactDOM.createRoot(document.getElementById('root'))
        .render(React.createElement(BlackjackGame));
})();
