---
title: "Setting up JRuby and Mahout 0.8 on Mac OSX"
date: 2014-01-26 17:05
comments: true
tags: ["Ruby", "JRuby", "Java", "Mahout"]
---

![](/images/jruby_mahout.png)

This is how I managed to set up [JRuby](http://jruby.org/) and [Mahout](http://mahout.apache.org/) 0.8 on Mac OSX 10.9 – Without any gems. 

Part of the reason for this is [`jruby_mahout`](https://github.com/vasinov/jruby_mahout) currently only works with Mahout 0.7, and I was too lazy and impatient to get it to work with Mahout 0.8.

I am especially excited because this I think exhibits one of the best use-cases for JRuby – Interoping with existing (awesome) Java libraries with minimum hassle.

## Step 1a. Installing JRuby with `rbenv`

Grab the latest `rbenv`

```
> brew upgrade rbenv
> brew upgrade ruby-build
```

Let's pick the latest JRuby version.

```
> rbenv install -l | grep 'jruby'`
> ...
	jruby-1.7.4
	jruby-1.7.5
	jruby-1.7.6
	jruby-1.7.7
	jruby-1.7.8
	jruby-1.7.9
> rbenv install jruby-1.7.9
```

Then we switch to JRuby.

```
> rbenv shell jruby-1.7.9	
```

Note that this command would swith to `jruby-1.7.9` only for the _current_ terminal window.

## Step 1b. Installing JRuby with `rvm`

```
> rvm install jruby
> rvm use jruby
```

## Step 2. Installing Mahout


```
brew install mahout
```

## Step 3: `export` the Mahout directory

In your `~/.bashrc` or `~/.zshrc`, add this line:

```
export MAHOUT_DIR="/usr/local/Cellar/mahout/0.8/"
```

Remember to `source ~/.bashrc` or `source ~/.zshrc` for the changes to be picked up.

To double check:

```
> echo $MAHOUT_DIR
/usr/local/Cellar/mahout/0.8/
```

## Step 4: Taking Mahout for a spin


Create a file `data.csv` and populate it with the following data:

```
4	1
7	2
4	4
1	4
4	3
8	1
8	3
4	5
4	6
6	6
```

Then create `mahout_test_run.rb`:


```ruby
Dir.glob("#{ENV['MAHOUT_DIR']}/libexec/*.jar").each { |d| require d }

MahoutFile = org.apache.mahout.cf.taste.impl.model.file
model = MahoutFile.FileDataModel.new(java.io.File.new("data.csv"))

MahoutSimilarity = org.apache.mahout.cf.taste.impl.similarity
similarity = MahoutSimilarity.TanimotoCoefficientSimilarity.new(model)

MahoutNeighborhood = org.apache.mahout.cf.taste.impl.neighborhood
neighborhood = MahoutNeighborhood.NearestNUserNeighborhood.new(5, similarity, model)

MahoutRecommender = org.apache.mahout.cf.taste.impl.recommender
recommender = MahoutRecommender.GenericBooleanPrefUserBasedRecommender.new(model, neighborhood, similarity)
recommendations = recommender.recommend(8, 5)

puts recommendations
```

Next run the script:

```
> ruby mahout_test_run.rb
```

If everything went rosy, you would get:

```
Jan 26, 2014 12:36:52 PM org.slf4j.impl.JCLLoggerAdapter info
INFO: Creating FileDataModel for file data.csv
Jan 26, 2014 12:36:52 PM org.slf4j.impl.JCLLoggerAdapter info
INFO: Reading file info...
Jan 26, 2014 12:36:52 PM org.slf4j.impl.JCLLoggerAdapter info
INFO: Read lines: 10
[RecommendedItem[item:4, value:0.4], RecommendedItem[item:5, value:0.4], RecommendedItem[item:6, value:0.4]]
``` 

## Step 5: Profit!

# 
Thanks for reading! Go forth and build awesome recommendation systems! :)















