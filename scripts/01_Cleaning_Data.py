#!/usr/bin/env python
# coding: utf-8

# In[1]:


import sys
sys.path.append('../__pypackages__/3.9/lib/')
print(sys.path)


# # Cleaning Data

# In[2]:


#| hide
import pandas as pd
import numpy as np


# First let's define where our data is located to easliy import it.

# In[3]:


working_data = '../data/working-data'


# We will be using the `Concatenated_Orig_data.csv`, that was created using the `00_Collecting_Data.ipynb`

# In[4]:


df = pd.read_csv(f"{working_data}/Concatenated_Orig_data.csv",encoding='latin-1', header=0)


# ## Preprocessing

# First, lets examine our data:

# In[5]:


df.head()


# Let's clean the data set by dropping duplicate entries by the identification number and converting blank cells to `NaN`

# In[6]:


df = df.drop_duplicates(subset=['c5'])
df.replace(r'^\s*$', np.nan, regex=True, inplace=True)


# ## Selecting Opcodes

# In[7]:


#| hide
import numpy as np 
import pandas as pd 
import matplotlib.pyplot as plt 
import seaborn as sns


# Now, let's get a better sense of the target column `c78`. Specifcally, we'd like to know how many instances there are of each label, and limit ourselves to only the most frequent labels to reduce numerosity.

# Let's limit the data to those entries with the value of `c78` appearing in the `AIDCODE.csv`

# In[8]:


df2 = pd.read_csv("../data/raw-data/AIDCODE.csv")
list_code = df2['CODE'].unique()
list_code = list_code.tolist()


# In[9]:


#drop rows that contain any value in the list
df = df[df.c78.isin(list_code) == True]


# In[10]:


df.dropna(subset=['c78'],inplace=True)


# In[11]:


df['c78'].value_counts()


# In[12]:


df.shape[0]


# ## Saving

# In[13]:


df.to_csv("../data/cleaned-data/Concatenated_Clean_data.csv")

