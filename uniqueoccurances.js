export default (stringInput, caseSensivity=false) =>
{
    if (stringInput === '') return null;

    if (!caseSensivity) stringInput = stringInput.toLowerCase();

    stringInput = stringInput.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    
    var stringInputConverted = stringInput.split(' ');

    var totalWords = stringInputConverted.length;

    var uniqueWords = Array.from(new Set(stringInputConverted));

    var uniqueWordsCount = uniqueWords.length;

    var wordsCount = {};
    stringInputConverted.forEach((word)=>{
        if(wordsCount.hasOwnProperty(word)) wordsCount[word]++;
        else wordsCount[word]=1;
    });

    return {
        totalWords:totalWords,
        uniqueWords:uniqueWords,
        uniqueWordsCount:uniqueWordsCount,
        wordsCount:wordsCount
    }
}