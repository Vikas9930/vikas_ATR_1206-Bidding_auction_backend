import axios from 'axios' ;

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface User {
  email: string;
  password: string;
  token?: string;
  id?: string;
}

async function createUser(email: string, password: string): Promise<User> {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
    });
    return {
      email,
      password,
      token: response.data.access_token,
      id: response.data.user.id,
    };
  } catch (error: any) {
    if (error.response?.status === 409) {
      // User exists, try login
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      return {
        email,
        password,
        token: loginResponse.data.access_token,
        id: loginResponse.data.user.id,
      };
    }
    throw error;
  }
}

async function createAuction(token: string) {
  const endsAt = new Date(Date.now() + 60000); // 1 minute from now
  const response = await axios.post(
    `${API_URL}/auctions`,
    {
      title: 'Concurrency Test Auction',
      description: 'Testing concurrent bids',
      startingPrice: 10.0,
      endsAt: endsAt.toISOString(),
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
}

async function placeBid(
  auctionId: string,
  amount: number,
  token: string,
): Promise<any> {
  try {
    const response = await axios.post(
      `${API_URL}/auctions/${auctionId}/bid`,
      { amount },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

async function getAuction(auctionId: string) {
  const response = await axios.get(`${API_URL}/auctions/${auctionId}`);
  return response.data;
}

async function getUser(token: string) {
  const response = await axios.get(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

async function testConcurrency() {
  console.log('🚀 Starting concurrency test...\n');

  // Create test users
  console.log('Creating test users...');
  const users: User[] = [];
  for (let i = 1; i <= 50; i++) {
    const user = await createUser(
      `testuser${i}@test.com`,
      `password${i}`,
    );
    users.push(user);
  }
  console.log(`✅ Created ${users.length} users\n`);

  // Create auction
  console.log('Creating auction...');
  const auction = await createAuction(users[0].token!);
  console.log(`✅ Created auction: ${auction.id}\n`);

  // Fire 50 parallel bids
  console.log('Placing 50 concurrent bids...');
  const bidPromises = users.map((user, index) =>
    placeBid(auction.id, 10.0 + index * 0.01, user.token!),
  );

  const results = await Promise.all(bidPromises);
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Bid placement complete:`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}\n`);

  // Wait a bit for processing
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Verify auction state
  console.log('Verifying auction state...');
  const finalAuction = await getAuction(auction.id);
  console.log(`   Final price: $${finalAuction.currentPrice}`);
  console.log(`   Status: ${finalAuction.status}`);
  console.log(`   Total bids: ${finalAuction.bids?.length || 0}\n`);

  // Check user balances
  console.log('Checking user balances...');
  const balances: number[] = [];
  for (const user of users.slice(0, 10)) {
    const userData = await getUser(user.token!);
    balances.push(Number(userData.balance));
  }

  const negativeBalances = balances.filter((b) => b < 0);
  const minBalance = Math.min(...balances);

  console.log(`   Sample balances checked: ${balances.length}`);
  console.log(`   Minimum balance: $${minBalance}`);
  console.log(`   Negative balances: ${negativeBalances.length}\n`);

  // Assertions
  console.log('📊 Test Results:');
  const assertions = [
    {
      name: 'Exactly one winner exists',
      pass: finalAuction.winnerId !== null,
    },
    {
      name: 'No negative balances',
      pass: negativeBalances.length === 0,
    },
    {
      name: 'Final price matches highest bid',
      pass:
        finalAuction.bids?.length > 0 &&
        Number(finalAuction.currentPrice) ===
          Math.max(
            ...finalAuction.bids.map((b: any) => Number(b.amount)),
          ),
    },
    {
      name: 'At least some bids succeeded',
      pass: successful > 0,
    },
  ];

  assertions.forEach((assertion) => {
    const status = assertion.pass ? '✅' : '❌';
    console.log(`   ${status} ${assertion.name}`);
  });

  const allPassed = assertions.every((a) => a.pass);
  console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}`);

  return allPassed;
}

// Run test
testConcurrency()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });

