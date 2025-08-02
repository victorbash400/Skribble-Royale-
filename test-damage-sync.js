// Test damage synchronization between clients
// This test simulates two clients and verifies damage events are properly synchronized

import WebSocketServer from './src/server/WebSocketServer.js';
import { WebSocket } from 'ws';

class DamageSyncTest {
    constructor() {
        this.server = null;
        this.client1 = null;
        this.client2 = null;
        this.roomCode = null;
        this.player1Id = null;
        this.player2Id = null;
        this.testResults = [];
    }

    async runTest() {
        console.log('🧪 Starting damage synchronization test...');
        
        try {
            // Start server
            await this.startServer();
            
            // Connect clients
            await this.connectClients();
            
            // Create and join room
            await this.setupRoom();
            
            // Test damage synchronization
            await this.testDamageSync();
            
            // Verify results
            this.verifyResults();
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        } finally {
            await this.cleanup();
        }
    }

    async startServer() {
        this.server = new WebSocketServer(8081);
        this.server.start();
        
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ Server started');
    }

    async connectClients() {
        // Connect client 1
        this.client1 = new WebSocket('ws://localhost:8081');
        await new Promise((resolve, reject) => {
            this.client1.on('open', resolve);
            this.client1.on('error', reject);
        });

        // Connect client 2
        this.client2 = new WebSocket('ws://localhost:8081');
        await new Promise((resolve, reject) => {
            this.client2.on('open', resolve);
            this.client2.on('error', reject);
        });

        // Get player IDs
        this.player1Id = await this.getPlayerId(this.client1);
        this.player2Id = await this.getPlayerId(this.client2);

        console.log(`✅ Clients connected: ${this.player1Id}, ${this.player2Id}`);
    }

    async getPlayerId(client) {
        return new Promise((resolve) => {
            client.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'connection_established') {
                    resolve(message.playerId);
                }
            });
        });
    }

    async setupRoom() {
        // Client 1 creates room
        this.client1.send(JSON.stringify({
            type: 'create_room',
            playerId: this.player1Id,
            data: {}
        }));

        // Wait for room creation
        this.roomCode = await new Promise((resolve) => {
            this.client1.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'room_created') {
                    resolve(message.data.roomCode);
                }
            });
        });

        // Client 2 joins room
        this.client2.send(JSON.stringify({
            type: 'join_room',
            playerId: this.player2Id,
            data: { roomCode: this.roomCode }
        }));

        // Wait for join confirmation
        await new Promise((resolve) => {
            this.client2.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'room_joined') {
                    resolve();
                }
            });
        });

        console.log(`✅ Room setup complete: ${this.roomCode}`);
    }

    async testDamageSync() {
        console.log('🎯 Testing damage synchronization...');

        // Set up message listeners
        const client1Messages = [];
        const client2Messages = [];

        this.client1.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === 'player_action' && message.data.action === 'damage_dealt') {
                client1Messages.push(message);
            }
        });

        this.client2.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === 'player_action' && message.data.action === 'damage_dealt') {
                client2Messages.push(message);
            }
        });

        // Client 1 deals damage to Client 2
        const damageAmount = 25;
        this.client1.send(JSON.stringify({
            type: 'player_action',
            playerId: this.player1Id,
            data: {
                action: 'damage_dealt',
                targetPlayerId: this.player2Id,
                damage: damageAmount,
                attackerPosition: { x: 100, y: 200 },
                targetPosition: { x: 150, y: 200 },
                timestamp: Date.now()
            }
        }));

        // Wait for damage event to be processed
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify both clients received the validated damage event
        this.testResults.push({
            test: 'damage_event_received_by_client1',
            passed: client1Messages.length > 0,
            details: `Client 1 received ${client1Messages.length} damage events`
        });

        this.testResults.push({
            test: 'damage_event_received_by_client2',
            passed: client2Messages.length > 0,
            details: `Client 2 received ${client2Messages.length} damage events`
        });

        // Verify damage values are consistent
        if (client1Messages.length > 0 && client2Messages.length > 0) {
            const client1Damage = client1Messages[0].data.damage;
            const client2Damage = client2Messages[0].data.damage;
            
            this.testResults.push({
                test: 'damage_values_consistent',
                passed: client1Damage === client2Damage,
                details: `Client 1: ${client1Damage}, Client 2: ${client2Damage}`
            });

            // Verify server validation
            const serverValidated = client1Messages[0].data.serverValidated && client2Messages[0].data.serverValidated;
            this.testResults.push({
                test: 'server_validation',
                passed: serverValidated,
                details: `Server validated: ${serverValidated}`
            });

            // Verify health values
            const client1Health = client1Messages[0].data.validatedHealth;
            const client2Health = client2Messages[0].data.validatedHealth;
            
            this.testResults.push({
                test: 'health_values_consistent',
                passed: client1Health === client2Health && client1Health === (100 - damageAmount),
                details: `Expected: ${100 - damageAmount}, Client 1: ${client1Health}, Client 2: ${client2Health}`
            });
        }

        console.log('✅ Damage synchronization test completed');
    }

    verifyResults() {
        console.log('\n📊 Test Results:');
        console.log('================');
        
        let passedTests = 0;
        let totalTests = this.testResults.length;

        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.test}: ${result.details}`);
            if (result.passed) passedTests++;
        });

        console.log(`\n📈 Summary: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All damage synchronization tests passed!');
        } else {
            console.log('⚠️  Some tests failed - damage synchronization needs fixes');
        }
    }

    async cleanup() {
        if (this.client1) {
            this.client1.close();
        }
        if (this.client2) {
            this.client2.close();
        }
        if (this.server && this.server.wss) {
            this.server.wss.close();
        }
        
        console.log('🧹 Cleanup completed');
    }
}

// Run the test
const test = new DamageSyncTest();
test.runTest().catch(console.error);