try {
    require('./src/controllers/market.controller');
    console.log('Controller loaded successfully');
} catch (error) {
    console.error('Error loading controller:');
    console.error(error);
}
