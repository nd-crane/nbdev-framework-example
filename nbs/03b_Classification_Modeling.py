#!/usr/bin/env python
# coding: utf-8

# # Classification Modeling

# Our objective is to identify the classification model that best predicts the primary cause of failure, `c78`, with respect to several evaluation metrics.
# 
# The final performance for each model is given below.
# 
# **Dummy Classifier**\
# Precision Macro: 0.0027+0.0000\
# Recall Macro: 0.0200+0.0000\
# F1 Macro: 0.0047+0.0000\
# F1 Micro: 0.1326+0.0000
# 
# 
# **Naive Bayes**\
# Precision Macro: 0.0027+0.0000\
# Recall Macro: 0.0200+0.0000\
# F1 Macro: 0.0047+0.0000\
# F1 Micro: 0.1326+0.0000
# 
# 
# **K-Nearest Neighbor**\
# Precision Macro: 0.2356+0.0423\
# Recall Macro: 0.1337+0.0067\
# F1 Macro: 0.1306+0.0092\
# F1 Micro: 0.3153+0.0098
# 
# 
# **Decision Tree**\
# Precision Macro: 0.3611+0.0058\
# Recall Macro: 0.3611+0.0058\
# F1 Macro: 0.1230+0.0067\
# F1 Micro: 0.3611+0.0058
# 
# 
# **SVM**\
# Precision Macro: 0.0453+0.0150\
# Recall Macro: 0.0212+0.0021\
# F1 Macro: 0.0181+0.0029\
# F1 Micro: 0.1487+0.0041
# 
# Notes
# - I am unsure why the Dummy Classifier deviated from Lindsey's results and is equal to the Naive Bayes. I re-ran Lindsey's notebooks though and got these same values so possibly she completed the Dummy Classifier prior to finalizing `Encoding_Feature.csv`
# - The Decison Tree and SVM scores are from an earlier run where I intentionally used a subset of the features and both still took a while to train. I will attempt to fit them again with all the features but it might prove infeasible.

# # Dummy Classifier

# In[51]:


#| hide
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_validate
from sklearn.metrics import recall_score
from sklearn.dummy import DummyClassifier
import matplotlib.pyplot as plt 
import seaborn as sns
import warnings
warnings.filterwarnings("ignore")


# First, we will fit a dummy model to act as a baseline.

# In[53]:


# Changing the read file location to the location of the file
df = pd.read_csv('../data/cleaned-data/Encoded_Features.csv', index_col=0)


# In[67]:


df.shape[0]


# In[54]:


# Separating the dependent and independent variable
y = df['c78'] #labels
X = df.drop('c78', axis=1) #features

# Splitting the data into training and testing data
X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size = 0.2)


# In[55]:


strategies = ['most_frequent', 'stratified', 'uniform']
  
test_scores = []
for s in strategies:
    if s =='constant':
        dclf = DummyClassifier(strategy = s, random_state = 0, constant ='M')
    else:
        dclf = DummyClassifier(strategy = s, random_state = 0)
        
    dclf.fit(X_train, y_train)
    y_pred = dclf.predict(X_test)    
    score = dclf.score(X_test, y_test)
    test_scores.append(score)
    #print(confusion_matrix(y_test, y_pred))
    #print(classification_report(y_test, y_pred))
    
dclf = DummyClassifier(strategy = 'most_frequent', random_state = 0)
scoring = ['precision_macro', 'recall_macro', 'f1_macro','f1_micro','accuracy']
scores_dclf = cross_validate(dclf, X, y,cv=10, scoring=scoring)
sorted(scores_dclf.keys())

print("%0.4f+%0.4f" % (scores_dclf['test_precision_macro'].mean(), scores_dclf['test_precision_macro'].std()))
print("%0.4f+%0.4f" % (scores_dclf['test_recall_macro'].mean(), scores_dclf['test_recall_macro'].std()))
print("%0.4f+%0.4f" % (scores_dclf['test_f1_macro'].mean(), scores_dclf['test_f1_macro'].std()))
print("%0.4f+%0.4f" % (scores_dclf['test_f1_micro'].mean(), scores_dclf['test_f1_micro'].std()))


# In[56]:


ax = sns.stripplot(strategies, test_scores);
ax.set(xlabel ='Dummy Strategy', ylabel ='Accuracy')


# # Naive Bayes

# In[98]:


#| hide
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_validate
from sklearn import datasets
from sklearn import naive_bayes


# Next, we will try a Naive Bayes model.

# In[99]:


# Read dataset to pandas dataframe
irisdata = pd.read_csv('../data/cleaned-data/Encoded_Features.csv', index_col=0)


# In[100]:


X = irisdata.drop('c78', axis=1)
y = irisdata['c78']


# In[101]:


X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.2)


# In[ ]:


from sklearn.model_selection import GridSearchCV
Naive = naive_bayes.MultinomialNB()

param_grid = {'alpha': [100000, 500000, 1000000]}
#use gridsearch to test all values for n_neighbors
nb_gscv = GridSearchCV(Naive, param_grid, cv=10, verbose=2)
#fit model to data
nb_gscv.fit(X, y)


# In[103]:


nb_gscv.best_params_


# In[104]:


Naive = naive_bayes.MultinomialNB(alpha=1000000)
Naive.fit(X_train,y_train)# predict the labels on validation dataset
predictions_NB = Naive.predict(X_test)# Use accuracy_score function to get the accuracy


# In[ ]:


scoring = ['precision_macro', 'recall_macro', 'f1_macro','f1_micro','accuracy']
scores_nb = cross_validate(Naive, X, y, cv=10, scoring = scoring, verbose=2)


# In[107]:


sorted(scores_nb.keys())
scores_nb


# In[108]:


print("%0.4f+%0.4f" % (scores_nb['test_precision_macro'].mean(), scores_nb['test_precision_macro'].std()))
print("%0.4f+%0.4f" % (scores_nb['test_recall_macro'].mean(), scores_nb['test_recall_macro'].std()))
print("%0.4f+%0.4f" % (scores_nb['test_f1_macro'].mean(), scores_nb['test_f1_macro'].std()))
print("%0.4f+%0.4f" % (scores_nb['test_f1_micro'].mean(), scores_nb['test_f1_micro'].std()))


# # K - Nearest Neighhbor

# In[2]:


#| hide
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
import plotly.offline as py
py.init_notebook_mode(connected=True)
import plotly.graph_objs as go
import plotly.tools as tls
import seaborn as sns
import matplotlib.image as mpimg
import matplotlib.pyplot as plt
import matplotlib
get_ipython().run_line_magic('matplotlib', 'inline')

# Import the 3 dimensionality reduction methods
from sklearn.decomposition import PCA


# In[4]:


data = pd.read_csv('../data/cleaned-data/Encoded_Features.csv',index_col=0)
data.head()

X = data.drop('c78', axis=1)
y = data['c78']
    
X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size = 0.2)


# In[112]:


from sklearn.neighbors import KNeighborsClassifier
knn = KNeighborsClassifier(n_neighbors = 10)
knn.fit(X_train,y_train)
y_pred = knn.predict(X_test)
knn.score(X_test,y_test)


# In[113]:


from sklearn.model_selection import cross_val_score
import numpy as np
#create a new KNN model
knn_cv = KNeighborsClassifier(n_neighbors=3)
#train model with cv of 10 
cv_scores = cross_val_score(knn_cv, X, y, cv=10)
#print each cv score (accuracy) and average them
print(cv_scores)
print('cv_scores mean:{}'.format(np.mean(cv_scores)))


# In[ ]:


from sklearn.model_selection import GridSearchCV
#create new a knn model
knn2 = KNeighborsClassifier()
#create a dictionary of all values we want to test for n_neighbors
param_grid = {'n_neighbors': np.arange(1, 100)}
#use gridsearch to test all values for n_neighbors
knn_gscv = GridSearchCV(knn2, param_grid, cv=10, verbose=10)
#fit model to data
knn_gscv.fit(X, y)


# In[115]:


knn_gscv.best_params_
#knn_gscv.best_score_


# In[116]:


from sklearn.model_selection import cross_validate
from sklearn.metrics import recall_score
import numpy as np
#create a new KNN model
knn_cv = KNeighborsClassifier(n_neighbors=45)
#train model with cv of 10 


# In[117]:


scoring = ['precision_macro', 'recall_macro', 'f1_macro','f1_micro','accuracy']
scores_knn = cross_validate(knn_cv, X, y, cv=10, scoring = scoring)
#print each cv score (accuracy) and average them
sorted(scores_knn.keys())
scores_knn


# In[118]:


print("%0.4f+%0.4f" % (scores_knn['test_accuracy'].mean(), scores_knn['test_accuracy'].std()))
print("%0.4f+%0.4f" % (scores_knn['test_precision_macro'].mean(), scores_knn['test_precision_macro'].std()))
print("%0.4f+%0.4f" % (scores_knn['test_recall_macro'].mean(), scores_knn['test_recall_macro'].std()))
print("%0.4f+%0.4f" % (scores_knn['test_f1_macro'].mean(), scores_knn['test_f1_macro'].std()))
print("%0.4f+%0.4f" % (scores_knn['test_f1_micro'].mean(), scores_knn['test_f1_micro'].std()))


# In[5]:


import matplotlib.pyplot as plt 
error_rate = []
from sklearn.neighbors import KNeighborsClassifier

for i in range(1,100):
    knn = KNeighborsClassifier(n_neighbors=i)
    knn.fit(X_train, y_train)
    pred = knn.predict(X_test)
    error_rate.append(np.mean(pred != y_test))


# In[9]:


#Best -> k = 31 -> err_rate = 0.6762285445567835
error_rate.index(min(error_rate))
error_rate[30]


# In[10]:


fig = plt.figure(figsize=(15,10))
plt.rcParams.update({'font.size': 20})
plt.xlabel("k value")
plt.ylabel("Error Rate")
plt.plot(range(1,100),error_rate, marker='o', markersize=9)


# # Decision Tree

# In[148]:


import numpy as np 
import pandas as pd 
import matplotlib.pyplot as plt 
from sklearn import tree
from sklearn.tree import DecisionTreeClassifier


# In[149]:


dataset = pd.read_csv('../data/cleaned-data/Encoded_Features.csv',index_col=0) 
dataset


# In[150]:


from sklearn.model_selection import train_test_split
X = dataset.copy().drop(columns=['c78'])
y = dataset['c78']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20)


# In[151]:


targets = dataset['c78'].unique().tolist()
targets = [str(x) for x in targets]


# In[ ]:


from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import GridSearchCV
dTree = DecisionTreeClassifier()
#create a dictionary of all values we want to test for n_neighbors
param_grid = {'max_depth': np.arange(1, 100)}
#use gridsearch to test all values for n_neighbors
dTree_gscv = GridSearchCV(dTree, param_grid, cv=10, verbose=2)
#fit model to data
dTree_gscv.fit(X, y)


# In[153]:


dTree_gscv.best_params_


# In[154]:


from sklearn.model_selection import cross_validate
from sklearn.metrics import recall_score
from sklearn.metrics import accuracy_score
import numpy as np
#create a new KNN model
dTree = DecisionTreeClassifier(max_depth = 10)


# In[154]:


#train model with cv of 10 
scoring = ['precision_macro', 'recall_acro', 'f1_macro','f1_micro','accuracy']
scores_dt = cross_validate(dTree, X, y, cv=10, scoring = scoring)
#print each cv score (accuracy) and average them
sorted(scores_dt.keys())
print("%0.4f+%0.4f" % (scores_dt['test_precision_macro'].mean(), scores_dt['test_precision_macro'].std()))
print("%0.4f+%0.4f" % (scores_dt['test_recall_macro'].mean(), scores_dt['test_recall_macro'].std()))
print("%0.4f+%0.4f" % (scores_dt['test_f1_macro'].mean(), scores_dt['test_f1_macro'].std()))
print("%0.4f+%0.4f" % (scores_dt['test_f1_micro'].mean(), scores_dt['test_f1_micro'].std()))


# # SVM

# In[1]:


import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.model_selection import cross_validate
from sklearn import datasets
from sklearn.svm import SVC


# In[2]:


# Assign colum names to the dataset
colnames = ['c144','c23','c24','c25','c27','c13','c102','c106','c41','c49', 'c50', 'c52', 'c80', 'c96', 'c109','c78']

# Read dataset to pandas dataframe
irisdata = pd.read_csv('../data/cleaned-data/Encoded_Features.csv',usecols=colnames)


# In[3]:


X = irisdata.drop('c78', axis=1)
y = irisdata['c78']


# In[4]:


X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.2)


# In[ ]:


clf = SVC(kernel = 'poly', degree = 8)
#clf.fit(X_train, y_train)
scoring = ['precision_macro', 'recall_macro', 'f1_macro','f1_micro','accuracy']
scores_res = cross_validate(clf, X, y, cv=10, scoring = scoring)


# In[ ]:


from sklearn.model_selection import GridSearchCV
clf = SVC(kernel = 'poly', degree = 2)

param_grid = {'degree': [2, 4, 10]}
#use gridsearch to test all values for n_neighbors
svm_gscv = GridSearchCV(clf, param_grid, cv=2)
#fit model to data
svm_gscv.fit(X, y)


# In[7]:


sorted(scores_res.keys())
scores_res


# In[8]:


print("%0.4f+%0.4f" % (scores_res['test_accuracy'].mean(), scores_res['test_accuracy'].std()))
print("%0.4f+%0.4f" % (scores_res['test_precision_macro'].mean(), scores_res['test_precision_macro'].std()))
print("%0.4f+%0.4f" % (scores_res['test_recall_macro'].mean(), scores_res['test_recall_macro'].std()))
print("%0.4f+%0.4f" % (scores_res['test_f1_macro'].mean(), scores_res['test_f1_macro'].std()))
print("%0.4f+%0.4f" % (scores_res['test_f1_micro'].mean(), scores_res['test_f1_micro'].std()))


# In[ ]:


from sklearn.metrics import classification_report, confusion_matrix
print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))

