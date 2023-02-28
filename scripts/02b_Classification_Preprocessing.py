#!/usr/bin/env python
# coding: utf-8

# In[1]:


#| hide
import sys
sys.path.append('../__pypackages__/3.9/lib/')
print(sys.path)


# # Classification Preprocessing

# ## Preliminary Analysis

# In[2]:


#| hide
import pandas as pd
import numpy as np


# In[4]:


df = pd.read_csv('../data/cleaned-data/Concatenated_Clean_data.csv')


# We can now focus on the features of interest

# In[5]:


list1 = df.columns.tolist()
list2 = ['c109','c52','c53','c56','c50','c144','c24','c23','c25','c78','c27','c13','c102','c106','c41','c49','c59','c80','c96']
set_dif = set(list1).symmetric_difference(set(list2))
temp3 = list(set_dif)
df.drop(columns=temp3, inplace=True)


# In[6]:


df


# Let's look at the percentage of null values in each column grouped into bins with width 10%

# In[13]:


na_count = df.isna().sum()
shape = df.shape[0]
print(shape)
print(len(df.columns))
total = shape
acceptable_pct_100 = total
acceptable_pct_90 = total * .9
acceptable_pct_80 = total * .8
acceptable_pct_70 = total * .7
acceptable_pct_60 = total * .6
acceptable_pct_50 = total * .5
acceptable_pct_40 = total * .4
acceptable_pct_30 = total * .3
acceptable_pct_20 = total * .2
acceptable_pct_10 = total * .1
acceptable_pct_0 = 0
acceptable_columns = {
    '100': [],
    '90': [],
    '80': [],
    '70': [],
    '60': [],
    '50': [],
    '40': [],
    '30': [],
    '20': [],
    '10': [],
    '0': [],
    'full': []
}
for column in df.columns:
    column_counts = df[column].value_counts()
    na_count = df[column].isna().sum()
    na_series = pd.Series([na_count], index=['NaN'])  
    column_counts = pd.concat([column_counts, na_series], axis=0, join='outer') 
    if na_count == acceptable_pct_100:
        acceptable_columns['100'].append(column)
    elif na_count > acceptable_pct_90:
        acceptable_columns['90'].append(column)
        print(column)
    elif na_count > acceptable_pct_80:
        acceptable_columns['80'].append(column)
    elif na_count > acceptable_pct_70:
        acceptable_columns['70'].append(column)
    elif na_count > acceptable_pct_60:
        acceptable_columns['60'].append(column)
    elif na_count > acceptable_pct_50:
        acceptable_columns['50'].append(column)
    elif na_count > acceptable_pct_40:
        acceptable_columns['40'].append(column)
    elif na_count > acceptable_pct_30:
        acceptable_columns['30'].append(column)
    elif na_count > acceptable_pct_20:
        acceptable_columns['20'].append(column)
    elif na_count > acceptable_pct_10:
        acceptable_columns['10'].append(column)
    elif na_count > acceptable_pct_0:
        acceptable_columns['0'].append(column)
    elif na_count == acceptable_pct_0:
        acceptable_columns['full'].append(column)
#print(df.describe())
#print(len(acceptable_columns), acceptable_columns)
total_columns_in_dict = 0
for key, value in acceptable_columns.items():
    print(key,' : ',len(value))
    total_columns_in_dict += len(value)


# We can now save the dataframe to a csv, called `19_features.csv`

# In[14]:


df.to_csv('../data/cleaned-data/19_features.csv')


# # Stratifying the Data

# In[15]:


#| hide
import numpy as np 
import pandas as pd 
import matplotlib.pyplot as plt 
import seaborn as sns


# Now, let's get a better sense of the target column `c78`. Specifcally, we'd like to know how many instances there are of each label, and limit ourselves to only the most frequent labels to reduce numerosity.

# Let's take a stratified random sample of observations to reduce numerosity while maintainig the reletaive frequency of `c78` labels

# In[16]:


N = (df.shape[0] * .2)

#perform stratified random sampling
df2 = df.groupby('c78', group_keys=False).apply(lambda x: x.sample(int(np.rint(N*len(x)/len(df))))).sample(frac=1).reset_index(drop=True)


# In[17]:


df2['c78'].value_counts()


# In[18]:


df2.shape[0]


# In[19]:


df2['c78'].unique()


# In[20]:


top_labels = df2['c78'].value_counts()[:50].index.tolist()
df2 =df2[df2['c78'].isin(top_labels)]


# In[21]:


df2.shape[0]


# In[22]:


strat_df = df2


# ## Feature Selection

# In[23]:


#| hide
import numpy as np 
import pandas as pd 
import matplotlib.pyplot as plt 
import seaborn as sns


# We see that some of the features are categorical

# In[24]:


df=strat_df
df.head()


# In[33]:


df.dtypes


# In[34]:


bin_cols = ['c50', 'c53', 'c56']
for col in bin_cols:
    df[col] = pd.qcut(df[col], q = 10, labels = [i for i in range(10)])

df[bin_cols]


# In[35]:


df = df.astype({'c50': object, 'c53': object, 'c56': object})
df.dtypes


# Let's one-hot encode the categorical variables

# In[36]:


from sklearn.preprocessing import LabelEncoder
# instantiate labelencoder object
le = LabelEncoder()

# apply le on categorical feature columns
df['c78'] = le.fit_transform(df['c78'])

categorical_cols = df.columns.to_list()
categorical_cols.remove('c78')

#One-hot-encode the categorical columns.

one_hot = pd.get_dummies(df[categorical_cols])

#Concatenate the two dataframes : 
df = pd.concat([one_hot, df['c78']], axis=1)


# In[37]:


df.head()


# In[39]:


df.to_csv('../data/cleaned-data/Encoded_Features.csv')

