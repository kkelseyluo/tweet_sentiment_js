'use strict';

//1. A function to split up the tweet's text (a string) into individual words (an array).
function splitWord(string){
    var word_list = string.split(/\W+/);
    var new_word_list = [];
    for (var i=0; i<word_list.length; i++) {
        var word = word_list[i];
        if (word.length>1){
            new_word_list.push(word.toLowerCase());
        }
    }
return new_word_list;
}

//2. A function that filters an array of words to only get those words that contain a specific emotion.
function emotionFilter(string,emotion){
    var filter_list = [];
    var word_list = splitWord(string);
    for (var i=0;i <word_list.length; i++){
        var wd = word_list[i];
        if(SENTIMENTS[wd] != undefined){
            if(SENTIMENTS[wd][emotion] == 1){
                filter_list.push(wd);
            }
        }
    }
    return filter_list;
}

//3. A function that determines which words from an array have each emotion, returning an object that contains that information.
function dictEmotions(string){
    var dictionary = {};
    for (var i=0; i<EMOTIONS.length; i++){
        dictionary[EMOTIONS[i]] = emotionFilter(string,EMOTIONS[i]);
    }
    return dictionary;
}
 
//4. A function that gets an array of the "most common" words in an array, ordered by their frequency.
function wordFrequency(string_list){
    var word_dict = {}
    for (var i=0; i<string_list.length; i++){
        if (word_dict[string_list[i]] != undefined)
        {
            word_dict[string_list[i]]++;
        } else {
            word_dict[string_list[i]] = 0;
        }
    }
    var keysSorted = Object.keys(word_dict).sort(function(a,b){
        return word_dict[b] - word_dict[a]
    })
    return keysSorted;
}


function getTweetList(SAMPLE_TWEETS){
    var tweet_list = []
    for (var i=0; i<SAMPLE_TWEETS.length; i++){
        tweet_list.push(SAMPLE_TWEETS[i]["text"]);
    }
    return tweet_list;
}

function getHashtagList(TWEETs){
    var hashtags = [];
    for (var i=0; i<TWEETs.length; i++){
        var tweet = TWEETs[i];
        if (tweet['entities']['hashtags']==[]){
            var temp = '';
        } else {
            var temp = [];
            for (var k=0; k<tweet['entities']['hashtags'].length; k++) {
                temp.push('#' + tweet['entities']['hashtags'][k]['text'].toLowerCase());
            }
        }
        hashtags.push(temp)
    }
    return hashtags
}

//5. A function that takes in an array of tweet objects and returns an array of all the words included in those tweets
function getAllWords(text_list){
    var line = text_list.reduce(function(a,b){
        return splitWord(a) + ',' + splitWord(b);
    })
    return line.split(',').length;
}

// 6. A function that takes in two parameters: a tweet object and a single emotion (e.g., "happy").
function getEmotionHashtags(string,hashtag){
    var hash_dict = dictEmotions('');
    if (hashtag != ''){
        for (var i=0; i<EMOTIONS.length; i++){        
            hash_dict[EMOTIONS[i]] = emotionFilter(string,EMOTIONS[i]);
            if (hash_dict[EMOTIONS[i]].length > 0){
                hash_dict[EMOTIONS[i]] = hashtag;
            } else {
                hash_dict[EMOTIONS[i]] = [];
            }
        }
    }
    return hash_dict
 }

// 7. An analyzeTweets() function that takes in an array of tweets and returns an object containing the data of interest.
function analyzeTweets(SAMPLE_TWEETS){
    var tweet_list = getTweetList(SAMPLE_TWEETS);
    var hashtag_list = getHashtagList(SAMPLE_TWEETS);
    var num_total_words = getAllWords(tweet_list);

    var dict_words = dictEmotions('');
    var dict_hashs = dictEmotions('');
    for (var i=0; i<tweet_list.length; i++){
        var dict_emotion = dictEmotions(tweet_list[i]);
        var dict_emotion_hashtag = getEmotionHashtags(tweet_list[i],hashtag_list[i]);
        for(var k=0; k<EMOTIONS.length; k++){
            var tEmo = dict_words[EMOTIONS[k]];
            dict_words[EMOTIONS[k]] = tEmo.concat(dict_emotion[EMOTIONS[k]]);
            var tEmo_hash = dict_hashs[EMOTIONS[k]];
            dict_hashs[EMOTIONS[k]] = tEmo_hash.concat(dict_emotion_hashtag[EMOTIONS[k]]);
        }
    }
    var data=dictEmotions('');
    for (var i=0; i<EMOTIONS.length; i++){
        data[EMOTIONS[i]]["emotion"] = EMOTIONS[i];
        data[EMOTIONS[i]]["percentage"] = dict_words[EMOTIONS[i]].length/num_total_words;
        data[EMOTIONS[i]]["example_words"] = wordFrequency(dict_words[EMOTIONS[i]]).slice(0, 3);
        data[EMOTIONS[i]]["hashtags"] = wordFrequency(dict_hashs[EMOTIONS[i]]).slice(0, 3);
    }
    var dict_word_freq = dictEmotions('');
    var dict_hash_freq = dictEmotions('');
    var table_dict = {};
    var data_value = Object.values(data);
    return data_value.sort(function(x, y){return d3.descending(x.percentage, y.percentage);});
}

// Displaying the Statistics
function showEmotionData(TWEETS,count=SAMPLE_TWEETS.length){
    var data = analyzeTweets(TWEETS)
    var table = d3.select("#emotionsTableContent");
    table.html('');
    for (var i=0; i<data.length; i++){
        var tr = '';
        var new_row = table.append('tr');
        tr += '<td>' + data[i]['emotion'] + '</td>';
        tr += '<td>' + (data[i]['percentage']*100).toFixed(2) + '%</td>';
        tr += '<td>' + data[i]['example_words'].join(', ') + '</td>';
        tr += '<td>' + data[i]['hashtags'].join(', ') + '</td>';
        new_row.html(tr);
    }
    var count_app = table.append('p');
    count_app.text('# of Tweets: ' + count);
}

// Getting Live Data
async function loadTweets(){
    var account = d3.select('#searchBox').property('value');
    var count = 324;
    d3.select("#emotionsTableContent").text('Please wait...');
    var tweets = await fetch('https://faculty.washington.edu/joelross/proxy/twitter/timeline/?screen_name='+account+'&count='+count).then(response=>response.json());
    if (tweets[0] == undefined){
        d3.select("#emotionsTableContent").text('Sorry, this account doesn\'t exist.')
    }
    else{
        showEmotionData(tweets,count);
    }
}

//show default SAMPLE_TWEETS data
showEmotionData(SAMPLE_TWEETS);
d3.select("#searchButton").on("click",function(){
    loadTweets();
});


