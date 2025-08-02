# Requirements Document

## Introduction

Scribble Royale is a browser-based multiplayer fighting game where players draw their own fighters and battle them in real-time combat. The game combines creative drawing with arcade-style fighting mechanics, allowing players to create unique PNG fighters from their drawings and control them in battle using keyboard inputs. Players can join or create rooms to battle against other players online. The entire experience runs natively in the browser using Phaser, requiring no installations.

## Requirements

### Requirement 1

**User Story:** As a player, I want to draw my own fighter on a blank canvas, so that I can create a unique character to battle with.

#### Acceptance Criteria

1. WHEN a player starts the game THEN the system SHALL display a blank drawing canvas
2. WHEN a player uses drawing tools THEN the system SHALL allow them to draw freely on the canvas
3. WHEN a player completes their drawing THEN the system SHALL convert the drawing to a PNG format
4. WHEN a player finishes drawing THEN the system SHALL provide a way to confirm and submit their creation

### Requirement 2

**User Story:** As a player, I want my drawn fighter to appear in the battle arena with proper physics, so that it can participate in combat.

#### Acceptance Criteria

1. WHEN a player submits their drawing THEN the system SHALL load the PNG into the battle arena
2. WHEN the PNG is loaded THEN the system SHALL apply physics properties (collision detection, gravity)
3. WHEN the fighter appears THEN the system SHALL display a health bar above the character
4. WHEN both players have submitted drawings THEN the system SHALL position fighters on opposite sides of the arena

### Requirement 3

**User Story:** As a player, I want to control my fighter using keyboard inputs, so that I can move, jump, and attack during battle.

#### Acceptance Criteria

1. WHEN a player presses movement keys THEN the system SHALL move the fighter left or right
2. WHEN a player presses the jump key THEN the system SHALL make the fighter jump with realistic physics
3. WHEN a player presses the attack key THEN the system SHALL trigger a punch animation and hitbox
4. WHEN a fighter's attack connects with the opponent THEN the system SHALL reduce the opponent's health

### Requirement 4

**User Story:** As a player, I want real-time combat with visual feedback, so that I can see the battle progress and know when someone wins.

#### Acceptance Criteria

1. WHEN a fighter takes damage THEN the system SHALL update their health bar in real-time
2. WHEN a fighter's health reaches zero THEN the system SHALL declare the other player as winner
3. WHEN combat occurs THEN the system SHALL provide visual feedback for hits and impacts
4. WHEN the battle ends THEN the system SHALL display win/lose results clearly

### Requirement 5

**User Story:** As a player, I want to play multiple rounds without refreshing, so that I can have continuous fun battles.

#### Acceptance Criteria

1. WHEN a battle ends THEN the system SHALL provide an option to play again
2. WHEN starting a new round THEN the system SHALL reset health bars to full
3. WHEN restarting THEN the system SHALL allow players to draw new fighters or reuse existing ones
4. WHEN multiple rounds are played THEN the system SHALL maintain smooth performance

### Requirement 6

**User Story:** As a player, I want to join or create multiplayer rooms, so that I can battle against other players online.

#### Acceptance Criteria

1. WHEN a player starts the game THEN the system SHALL display options to create or join a room
2. WHEN a player creates a room THEN the system SHALL generate a unique room code for sharing
3. WHEN a player joins a room with a valid code THEN the system SHALL connect them to the room
4. WHEN two players are in the same room THEN the system SHALL allow them to proceed to drawing and combat
5. WHEN a player leaves during any phase THEN the system SHALL handle disconnections gracefully

### Requirement 7

**User Story:** As a player, I want the game to run smoothly in my browser without any installations, so that I can play immediately.

#### Acceptance Criteria

1. WHEN a player visits the game URL THEN the system SHALL load completely in the browser using Phaser framework
2. WHEN the game runs THEN the system SHALL maintain consistent frame rates during drawing and combat using Phaser's rendering engine
3. WHEN loading assets THEN the system SHALL handle PNG loading efficiently through Phaser's asset management without browser crashes
4. WHEN multiple game sessions occur THEN the system SHALL manage memory properly using Phaser's lifecycle methods to prevent slowdowns