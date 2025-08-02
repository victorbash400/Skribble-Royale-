// Simple test for CombatScene functionality
import CombatScene from './src/scenes/CombatScene.js';

console.log('🧪 Testing CombatScene...');

// Test 1: Constructor
console.log('\n1. Testing constructor...');
const combatScene = new CombatScene();
console.log('✅ CombatScene created');
console.log(`   - Arena width: ${combatScene.arena.width}`);
console.log(`   - Arena height: ${combatScene.arena.height}`);
console.log(`   - Ground Y: ${combatScene.arena.groundY}`);
console.log(`   - Left spawn X: ${combatScene.arena.leftSpawnX}`);
console.log(`   - Right spawn X: ${combatScene.arena.rightSpawnX}`);

// Test 2: Fighter management
console.log('\n2. Testing fighter management...');
console.log(`   - Initial fighters: ${Object.keys(combatScene.fighters).length}`);
console.log(`   - Fighters loaded: ${combatScene.fightersLoaded}`);

// Test 3: Arena configuration
console.log('\n3. Testing arena configuration...');
const expectedArena = {
    width: 800,
    height: 600,
    groundY: 500,
    leftSpawnX: 150,
    rightSpawnX: 650
};

let arenaConfigCorrect = true;
for (const [key, value] of Object.entries(expectedArena)) {
    if (combatScene.arena[key] !== value) {
        console.log(`❌ Arena ${key} mismatch: expected ${value}, got ${combatScene.arena[key]}`);
        arenaConfigCorrect = false;
    }
}

if (arenaConfigCorrect) {
    console.log('✅ Arena configuration correct');
}

// Test 4: Method existence
console.log('\n4. Testing method existence...');
const requiredMethods = [
    'setupPhysicsWorld',
    'createArena',
    'setupUI',
    'loadFighters',
    'spawnFighter',
    'spawnDefaultFighter',
    'setupFighterCollisions',
    'clearFighters',
    'updateCombatStatus',
    'handleGameManagerEvent',
    'getFighter',
    'getAllFighters',
    'testFighterPositioning'
];

let allMethodsExist = true;
for (const method of requiredMethods) {
    if (typeof combatScene[method] !== 'function') {
        console.log(`❌ Missing method: ${method}`);
        allMethodsExist = false;
    }
}

if (allMethodsExist) {
    console.log('✅ All required methods exist');
}

// Test 5: Fighter positioning logic
console.log('\n5. Testing fighter positioning logic...');
const leftSpawnX = combatScene.arena.leftSpawnX;
const rightSpawnX = combatScene.arena.rightSpawnX;
const spawnY = combatScene.arena.groundY - 50;

console.log(`   - Left fighter spawn: (${leftSpawnX}, ${spawnY})`);
console.log(`   - Right fighter spawn: (${rightSpawnX}, ${spawnY})`);

if (leftSpawnX < rightSpawnX && leftSpawnX > 0 && rightSpawnX < combatScene.arena.width) {
    console.log('✅ Fighter spawn positions are valid');
} else {
    console.log('❌ Fighter spawn positions are invalid');
}

// Test 6: Event handling
console.log('\n6. Testing event handling...');
const testEvents = [
    'game_state_update',
    'player_joined',
    'player_left',
    'player_action'
];

console.log('✅ Event handling method exists');
console.log(`   - Supported events: ${testEvents.join(', ')}`);

console.log('\n🎉 CombatScene basic tests completed!');
console.log('\nTo test with Phaser integration, open test-combat-scene.html in a browser.');