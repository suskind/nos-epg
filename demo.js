
const NosEpg = require('./');

const foo = NosEpg(0, (err, data) => {
	if (err) {
		throw new Error('Error ', err);
		return;
	}
	console.log('Fui buscar isto...');
	console.log(JSON.stringify(data, null, 2));
}, () => {
	console.log('Espera um pouco que tenho de ir buscar isto à net... :) ');
});