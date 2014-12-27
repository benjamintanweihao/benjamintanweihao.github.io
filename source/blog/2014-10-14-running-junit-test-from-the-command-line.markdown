---
title: "Running JUnit tests from the Command Line"
date: 2014-10-14 11:15
comments: true
tags: Java, JUnit
---

At work, we had trouble figuring out how to run JUnit tests outside of the IDE, in this case, IntellJ. After some fumbling around, here's how we got it to work:

## Step 1: Compile the Test class

Navigate to the `src/` folder where all the Java classes are, then run `javac` to compile the test file.

```
% javac -cp .:"/Applications/IntelliJ IDEA 13 CE.app/Contents/lib/*" SetTest.java
```

Notice a couple of things.

Look at the flag passed in `-cp` (classpath). We are setting the _current_ directory (thats the ".") and also _all_ the libraries needed (that's the "*"). 

Once that's done, you will get a bunch of `*.class` files generated. If your test makes use of the class you want to test, then that will be compiled too.

## Step 2: Run the Test

```
% java -cp .:"/Applications/IntelliJ IDEA 13 CE.app/Contents/lib/*" org.junit.runner.JUnitCore SetTest
JUnit version 4.11
.
Time: 0.007

OK (1 test)
```

This looks almost the same, except that we need to specify the JUnit test runner (`org.junit.runner.JUnitCore`) and supply the class we are test (without the `.java` extenstion).


That's it! Hopefully this helped you save some time! 

Thanks for reading!
