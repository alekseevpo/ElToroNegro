const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserVerification(email) {
  try {
    console.log(`\n🔍 Checking user with email: ${email}\n`);
    
    // Try to find by email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { address: email.toLowerCase() },
        ],
      },
      select: {
        id: true,
        address: true,
        email: true,
        username: true,
        emailVerified: true,
        emailVerificationToken: true,
        emailVerificationSentAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      console.log('❌ User not found in database');
      console.log('\n💡 The user might not have been created yet.');
      console.log('   Try logging in first, which will create the profile.');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Address: ${user.address}`);
    console.log(`   Email: ${user.email || 'Not set'}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email Verified: ${user.emailVerified ? '✅ YES' : '❌ NO'}`);
    console.log(`   Has Verification Token: ${user.emailVerificationToken ? 'Yes' : 'No'}`);
    if (user.emailVerificationSentAt) {
      console.log(`   Verification Sent At: ${user.emailVerificationSentAt.toISOString()}`);
      const hoursAgo = (Date.now() - user.emailVerificationSentAt.getTime()) / (1000 * 60 * 60);
      console.log(`   (${hoursAgo.toFixed(1)} hours ago)`);
    }
    console.log(`   Created At: ${user.createdAt.toISOString()}`);
    console.log(`   Updated At: ${user.updatedAt.toISOString()}`);
    
    if (!user.emailVerified) {
      console.log('\n⚠️  Email is NOT verified');
      if (user.emailVerificationToken) {
        console.log('   A verification token exists - user can verify via link');
      } else {
        console.log('   No verification token - user needs to request verification email');
      }
    } else {
      console.log('\n✅ Email IS verified');
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'alekseevpo@gmail.com';
checkUserVerification(email);

