package org.biomart.configurator.wizard;

import java.beans.*;
import java.util.*;

import org.biomart.common.exceptions.MartBuilderException;

/**
 * The model for the Wizard component, which tracks the text, and enabled state
 * of each of the buttons, as well as the current panel that is displayed. It also remember
 * this state of all user interaction.
 */
public class WizardModel {

    /**
     * Identification string for the current panel.
     */    
    public static final String CURRENT_PANEL_DESCRIPTOR_PROPERTY = "currentPanelDescriptorProperty";
    
    /**
     * Property identification String for the Back button's text
     */    
    public static final String BACK_BUTTON_TEXT_PROPERTY = "backButtonTextProperty";
    /**
     * Property identification String for the Back button's enabled state
     */    
    public static final String BACK_BUTTON_ENABLED_PROPERTY = "backButtonEnabledProperty";

    /**
     * Property identification String for the Next button's text
     */    
    public static final String NEXT_FINISH_BUTTON_TEXT_PROPERTY = "nextButtonTextProperty";
    /**
     * Property identification String for the Next button's enabled state
     */    
    public static final String NEXT_FINISH_BUTTON_ENABLED_PROPERTY = "nextButtonEnabledProperty";
    
    /**
     * Property identification String for the Cancel button's text
     */    
    public static final String CANCEL_BUTTON_TEXT_PROPERTY = "cancelButtonTextProperty";
    /**
     * Property identification String for the Cancel button's enabled state
     */    
    public static final String CANCEL_BUTTON_ENABLED_PROPERTY = "cancelButtonEnabledProperty";
    
    private WizardPanel currentPanel;
    
    private HashMap<Object,WizardPanel> panelHashmap;    
    private HashMap<String,Object> buttonTextHashmap;
    private HashMap<String,Boolean> buttonEnabledHashmap;
    
    private Object result;
    
    private PropertyChangeSupport propertyChangeSupport;
    
    
    /**
     * Default constructor.
     */    
    public WizardModel() {        
        panelHashmap = new HashMap<Object,WizardPanel>();       
        buttonTextHashmap = new HashMap<String,Object>();
        buttonEnabledHashmap = new HashMap<String,Boolean>();       
        propertyChangeSupport = new PropertyChangeSupport(this);
    }
    
    /**
     * Returns the currently displayed WizardPanelDescriptor.
     * @return The currently displayed WizardPanelDescriptor
     */    
    WizardPanel getCurrentPanel() {
        return currentPanel;
    }
    
    /**
     * Registers the WizardPanelDescriptor in the model using the Object-identifier specified.
     * @param id Object-based identifier
     * @param descriptor WizardPanelDescriptor that describes the panel
     */    
     void registerPanel(Object id, WizardPanel descriptor) {
        
        //  Place a reference to it in a hashtable so we can access it later
        //  when it is about to be displayed.        
        panelHashmap.put(id, descriptor);       
    }  
    
    /**
     * Sets the current panel to that identified by the Object passed in.
     * @param id Object-based panel identifier
     * @return boolean indicating success or failure
     */    
     boolean setCurrentPanel(Object id) {

        //  First, get the hashtable reference to the panel that should
        //  be displayed.
        
        WizardPanel nextPanel =
            (WizardPanel)panelHashmap.get(id);
        
        //  If we couldn't find the panel that should be displayed, return
        //  false.
        
        if (nextPanel == null)
            throw new MartBuilderException();   

        WizardPanel oldPanel = currentPanel;
        currentPanel = nextPanel;
        
        if (oldPanel != currentPanel)
            firePropertyChange(CURRENT_PANEL_DESCRIPTOR_PROPERTY, oldPanel, currentPanel);
        
        return true;
        
    }

    Object getBackButtonText() {
        return buttonTextHashmap.get(BACK_BUTTON_TEXT_PROPERTY);
    }
    
    void setBackButtonText(Object newText) {
        
        Object oldText = getBackButtonText();        
        if (!newText.equals(oldText)) {
            buttonTextHashmap.put(BACK_BUTTON_TEXT_PROPERTY, newText);
            firePropertyChange(BACK_BUTTON_TEXT_PROPERTY, oldText, newText);
        }
    }

    Object getNextFinishButtonText() {
        return buttonTextHashmap.get(NEXT_FINISH_BUTTON_TEXT_PROPERTY);
    }
    
    void setNextFinishButtonText(Object newText) {
        
        Object oldText = getNextFinishButtonText();        
        if (!newText.equals(oldText)) {
            buttonTextHashmap.put(NEXT_FINISH_BUTTON_TEXT_PROPERTY, newText);
            firePropertyChange(NEXT_FINISH_BUTTON_TEXT_PROPERTY, oldText, newText);
        }
    }

    Object getCancelButtonText() {
        return buttonTextHashmap.get(CANCEL_BUTTON_TEXT_PROPERTY);
    }
    
    void setCancelButtonText(Object newText) {
        
        Object oldText = getCancelButtonText();        
        if (!newText.equals(oldText)) {
            buttonTextHashmap.put(CANCEL_BUTTON_TEXT_PROPERTY, newText);
            firePropertyChange(CANCEL_BUTTON_TEXT_PROPERTY, oldText, newText);
        }
    } 
            
    
    Boolean getBackButtonEnabled() {
        return (Boolean)buttonEnabledHashmap.get(BACK_BUTTON_ENABLED_PROPERTY);
    }
    
    void setBackButtonEnabled(Boolean newValue) {
        
        Boolean oldValue = getBackButtonEnabled();        
        if (newValue != oldValue) {
            buttonEnabledHashmap.put(BACK_BUTTON_ENABLED_PROPERTY, newValue);
            firePropertyChange(BACK_BUTTON_ENABLED_PROPERTY, oldValue, newValue);
        }
    }

    Boolean getNextButtonEnabled() {
        return (Boolean)buttonEnabledHashmap.get(NEXT_FINISH_BUTTON_ENABLED_PROPERTY);
    }
    
    void setNextButtonEnabled(Boolean newValue) {       
        Boolean oldValue = getNextButtonEnabled();        
        if (newValue != oldValue) {
            buttonEnabledHashmap.put(NEXT_FINISH_BUTTON_ENABLED_PROPERTY, newValue);
            firePropertyChange(NEXT_FINISH_BUTTON_ENABLED_PROPERTY, oldValue, newValue);
        }
    }
    
    void setFinalButtonEnabled(Boolean b) {
    	
    }
    
    Boolean getCancelButtonEnabled() {
        return (Boolean)buttonEnabledHashmap.get(CANCEL_BUTTON_ENABLED_PROPERTY);
    }
    
    void setCancelButtonEnabled(Boolean newValue) {
        
        Boolean oldValue = getCancelButtonEnabled();        
        if (newValue != oldValue) {
            buttonEnabledHashmap.put(CANCEL_BUTTON_ENABLED_PROPERTY, newValue);
            firePropertyChange(CANCEL_BUTTON_ENABLED_PROPERTY, oldValue, newValue);
        }
    }
    
    
    
    public void addPropertyChangeListener(PropertyChangeListener p) {
        propertyChangeSupport.addPropertyChangeListener(p);
    }
    
    public void removePropertyChangeListener(PropertyChangeListener p) {
        propertyChangeSupport.removePropertyChangeListener(p);
    }
    
    protected void firePropertyChange(String propertyName, Object oldValue, Object newValue) {
        propertyChangeSupport.firePropertyChange(propertyName, oldValue, newValue);
    }


    public void setWizardResultObject(Object result) {
		this.result = result;
	}


    public Object getWizardResultObject() {
		return result;
	}
    
}
